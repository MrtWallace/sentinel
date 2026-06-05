from dataclasses import asdict
from decimal import Decimal, InvalidOperation
import os
from typing import Any, Literal
from uuid import uuid4

from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel, Field

from audit import AuditLogger
from execution import build_execution_backend
from intent import proposal_from_dict
from llm import build_default_llm_client
from loop import AgenticLoop
from models import AgentResult, Suggestion, TxProposal
from reproposal import LLMReproposalAgent
from reviewers import LLMSecurityAuditor, LLMRiskAnalyst, MockSecurityAuditor
from risk.pipeline import RiskPipeline
from risk.rules import AmountRule, ApprovalRule, FrequencyRule, SlippageRule, WhitelistRule
from wallets import CawWalletService, UserWalletStore, WalletNotFoundError


DEFAULT_SWAP_CONTRACT = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"
DEFAULT_TRANSFER_RECIPIENT = "0x1111111111111111111111111111111111111111"

app = FastAPI(title="Sentinel Backend API", version="0.1.0")


class ExecuteRequest(BaseModel):
    intent: str = Field(default="")
    proposal: dict[str, Any] | None = None


class ConfirmRequest(BaseModel):
    tx_id: str
    action: Literal["approve", "reject"]


class ExistingWalletRequest(BaseModel):
    user_address: str
    caw_wallet_id: str
    caw_wallet_address: str | None = None


class CreateWalletRequest(BaseModel):
    user_address: str


class PactRequest(BaseModel):
    user_address: str
    limits: dict[str, Any] = Field(default_factory=dict)


class RefreshWalletStatusRequest(BaseModel):
    user_address: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/execute")
def execute(request: ExecuteRequest):
    tx = _proposal_from_request(request)
    loop = _build_loop()
    result = loop.run(tx)
    tx_id = str(uuid4())
    execution = _execute_if_allowed(result, tx_id)
    final_decision, status, decision_reason = _final_response_decision(
        result,
        execution,
    )

    response = {
        "tx_id": tx_id,
        "intent": request.intent,
        "input_proposal": request.proposal,
        "status": status,
        "decision": final_decision,
        "decision_reason": decision_reason,
        "sentinel_decision": result.final_decision.decision,
        "sentinel_decision_reason": result.final_decision.reason,
        "attempts": [_attempt_to_dict(attempt) for attempt in result.attempts],
        "decision_chain": _legacy_decision_chain(result),
        "execution": asdict(execution),
    }
    build_audit_logger().write(response)
    return response


@app.get("/api/audit-log")
def list_audit_log():
    return build_audit_logger().list()


@app.get("/api/audit-log/{tx_id}")
def get_audit_log(tx_id: str):
    record = build_audit_logger().get(tx_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Audit record not found")
    return record


@app.post("/api/confirm")
def confirm(request: ConfirmRequest):
    logger = build_audit_logger()
    record = logger.get(request.tx_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Audit record not found")

    record["confirmation"] = {
        "action": request.action,
        "status": "approved" if request.action == "approve" else "rejected",
    }
    if request.action == "reject":
        record["status"] = "rejected"
        record["decision"] = "reject"
        record["decision_reason"] = "User rejected confirmation request."

    logger.write(record)
    return record


@app.get("/api/wallet/status")
def get_wallet_status(user_address: str):
    return build_wallet_service().get_status(user_address)


@app.post("/api/wallet/connect-existing")
def connect_existing_wallet(request: ExistingWalletRequest):
    return build_wallet_service().connect_existing(
        user_address=request.user_address,
        caw_wallet_id=request.caw_wallet_id,
        caw_wallet_address=request.caw_wallet_address,
    )


@app.post("/api/wallet/create")
def create_wallet(request: CreateWalletRequest):
    return build_wallet_service().create_wallet(request.user_address)


@app.post("/api/wallet/pact")
def submit_wallet_pact(request: PactRequest):
    try:
        return build_wallet_service().submit_pact(
            request.user_address,
            request.limits,
        )
    except WalletNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/wallet/refresh-status")
def refresh_wallet_status(request: RefreshWalletStatusRequest):
    try:
        return build_wallet_service().refresh_status(request.user_address)
    except WalletNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


def _build_loop() -> AgenticLoop:
    security_auditor, risk_analyst = _build_reviewers()
    reproposal_agent = _build_reproposal_agent()
    return AgenticLoop(
        risk_pipeline=RiskPipeline(
            [
                AmountRule(),
                SlippageRule(),
                WhitelistRule(),
                ApprovalRule(),
                FrequencyRule(),
            ]
        ),
        security_auditor=security_auditor,
        risk_analyst=risk_analyst,
        reproposal_agent=reproposal_agent,
    )


def build_audit_logger() -> AuditLogger:
    return AuditLogger()


def build_wallet_service() -> CawWalletService:
    return CawWalletService(UserWalletStore.from_env())


def _build_reviewers():
    reviewer_mode = os.getenv("REVIEWER_MODE", "mock").lower()
    if reviewer_mode == "llm":
        llm = build_default_llm_client()
        return LLMSecurityAuditor(llm), LLMRiskAnalyst(llm)
    return MockSecurityAuditor(mode="safe"), DemoRiskAnalyst()


def _build_reproposal_agent():
    reproposal_mode = os.getenv("REPROPOSAL_MODE", "mock").lower()
    if reproposal_mode == "llm":
        return LLMReproposalAgent(build_default_llm_client())
    return None


def _proposal_from_request(request: ExecuteRequest) -> TxProposal:
    if request.proposal is not None:
        return proposal_from_dict(request.proposal)

    return _demo_proposal_from_intent(request.intent)


def _execute_if_allowed(result, tx_id: str):
    if result.final_decision.decision != "execute":
        return build_execution_backend().execute(
            TxProposal(action="unknown", amount="0"),
            tx_id,
        )

    final_tx = result.attempts[-1].tx_proposal
    return build_execution_backend().execute(final_tx, tx_id)


def _final_response_decision(result, execution):
    if execution.status == "policy_denied":
        return (
            "reject",
            "rejected",
            f"CAW policy denied execution: {execution.reason}",
        )

    if execution.status == "failed":
        return (
            "reject",
            "rejected",
            f"Execution failed: {execution.reason}",
        )

    decision = result.final_decision.decision
    return (
        decision,
        _status_from_decision(decision),
        result.final_decision.reason,
    )


def _demo_proposal_from_intent(intent: str) -> TxProposal:
    lowered = intent.lower()
    amount = _extract_first_decimal(lowered)

    if "transfer" in lowered or "send" in lowered:
        return TxProposal(
            action="transfer",
            amount=amount or "0.01",
            recipient=DEFAULT_TRANSFER_RECIPIENT,
            reasoning="Deterministic demo parser generated a transfer proposal.",
        )

    if "swap" in lowered:
        return TxProposal(
            action="swap",
            amount=amount or "0.01",
            from_token="ETH",
            to_token="USDC",
            to_contract=DEFAULT_SWAP_CONTRACT,
            slippage=0.03,
            deadline=300,
            reasoning="Deterministic demo parser generated a swap proposal.",
        )

    return TxProposal(
        action="unknown",
        amount="0",
        reasoning="Minimal API could not parse intent.",
    )


def _extract_first_decimal(text: str) -> str | None:
    for word in text.replace(",", " ").split():
        try:
            Decimal(word)
            return word
        except InvalidOperation:
            continue
    return None


def _status_from_decision(decision: str) -> str:
    if decision == "execute":
        return "executed"
    if decision == "confirm":
        return "confirm_needed"
    return "rejected"


def _attempt_to_dict(attempt) -> dict[str, Any]:
    return {
        "attempt_index": attempt.attempt_index,
        "proposal": asdict(attempt.tx_proposal),
        "hard_rules": [asdict(rule) for rule in attempt.hard_rules],
        "security_audit": (
            asdict(attempt.security_audit) if attempt.security_audit else None
        ),
        "risk_analysis": asdict(attempt.risk_analysis) if attempt.risk_analysis else None,
        "decision": asdict(attempt.decision),
        "rejection_source": attempt.rejection_source,
    }


def _legacy_decision_chain(result) -> dict[str, Any]:
    first_attempt = result.attempts[0]
    last_attempt = result.attempts[-1]

    return {
        "agent_a": {"proposal": asdict(first_attempt.tx_proposal)},
        "hard_rules": [
            {
                "rule": rule.rule_name,
                "status": rule.status,
                "passed": rule.status in {"passed", "skipped"},
                "reason": rule.reason,
                "severity": rule.severity,
            }
            for rule in last_attempt.hard_rules
        ],
        "agent_b": (
            asdict(last_attempt.security_audit)
            if last_attempt.security_audit
            else None
        ),
        "agent_c": (
            asdict(last_attempt.risk_analysis)
            if last_attempt.risk_analysis
            else None
        ),
        "decision": _status_from_decision(result.final_decision.decision),
        "decision_reason": result.final_decision.reason,
        "simulation": {"success": True, "gas_estimate": None},
        "tx_hash": None,
    }


class DemoRiskAnalyst:
    def review(self, tx: TxProposal) -> AgentResult:
        try:
            amount = Decimal(tx.amount)
        except InvalidOperation:
            return AgentResult(
                agent_name="RiskAnalyst",
                passed=False,
                risk_level="high",
                findings=["Invalid transaction amount"],
                reasoning="Amount could not be parsed as a decimal.",
                suggestions=[],
            )

        if amount > Decimal("0.05"):
            return AgentResult(
                agent_name="RiskAnalyst",
                passed=False,
                risk_level="high",
                findings=["Transaction amount creates high exposure"],
                reasoning="Amount is too high for autonomous execution.",
                suggestions=[
                    Suggestion(
                        field="amount",
                        suggested_value="0.01",
                        reason="Reduce amount to lower exposure.",
                        rejection_code="amount_too_high",
                    )
                ],
            )

        return AgentResult(
            agent_name="RiskAnalyst",
            passed=True,
            risk_level="low",
            findings=[],
            reasoning="Amount is within autonomous execution limits.",
        )
