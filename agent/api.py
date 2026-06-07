from dataclasses import asdict
from decimal import Decimal, InvalidOperation
import os
from typing import Any, Literal
from uuid import uuid4

from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel, Field

from audit import AuditLogger
from config_store import UserConfigStore
from execution import ExecutionResult, build_execution_backend
from input_guard import (
    InputGuardError,
    detect_intent_proposal_anomaly,
    sanitize_user_input,
    validate_agent_output,
)
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
    user_address: str | None = None


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


class RiskConfigRequest(BaseModel):
    user_address: str
    config: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/execute")
def execute(request: ExecuteRequest):
    tx_id = str(uuid4())
    try:
        sanitized_intent = sanitize_user_input(request.intent)
        tx = _proposal_from_request(request)
        anomalies = detect_intent_proposal_anomaly(sanitized_intent, tx)
        if anomalies:
            raise InputGuardError(
                code="intent_proposal_anomaly",
                reason="Intent and proposal are inconsistent.",
                anomalies=anomalies,
            )
    except InputGuardError as exc:
        response = _input_guard_reject_response(
            request,
            tx_id,
            exc,
            _caw_status_for_request(request),
        )
        build_audit_logger().write(response)
        return response

    caw_status = _caw_status_for_request(request)
    if caw_status is not None and caw_status["readiness"] != "ready":
        response = _caw_not_ready_response(request, tx_id, caw_status)
        build_audit_logger().write(response)
        return response

    loop = _build_loop(request.user_address)
    result = loop.run(tx)
    execution = _execute_if_allowed(result, tx_id, caw_status)
    final_decision, status, decision_reason = _final_response_decision(
        result,
        execution,
    )

    response = {
        "tx_id": tx_id,
        "user_address": request.user_address,
        "intent": request.intent,
        "input_proposal": request.proposal,
        "status": status,
        "decision": final_decision,
        "decision_reason": decision_reason,
        "sentinel_decision": result.final_decision.decision,
        "sentinel_decision_reason": result.final_decision.reason,
        "caw": caw_status,
        "attempts": [_attempt_to_dict(attempt) for attempt in result.attempts],
        "decision_chain": _legacy_decision_chain(result),
        "execution": _execution_to_dict(execution, caw_status),
        "security": {"code": None, "reason": None},
        "tool_calls": [],
        "memory_anomalies": [],
    }
    build_audit_logger().write(response)
    return response


@app.get("/api/audit-log")
def list_audit_log(
    user_address: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
):
    return build_audit_logger().list(
        user_address=user_address,
        status=status,
        limit=limit,
        offset=offset,
    )


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
        result = build_wallet_service().submit_pact(
            request.user_address,
            request.limits,
        )
        build_config_store().mark_pact_synced(request.user_address, request.limits)
        return result
    except WalletNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/wallet/refresh-status")
def refresh_wallet_status(request: RefreshWalletStatusRequest):
    try:
        return build_wallet_service().refresh_status(request.user_address)
    except WalletNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/config")
def get_config(user_address: str):
    return build_config_store().get_config(user_address)


@app.put("/api/config")
def update_config(request: RiskConfigRequest):
    return build_config_store().update_config(request.user_address, request.config)


@app.post("/api/config/reset")
def reset_config(request: RiskConfigRequest):
    return build_config_store().reset_config(request.user_address)


def _build_loop(user_address: str | None = None) -> AgenticLoop:
    security_auditor, risk_analyst = _build_reviewers()
    reproposal_agent = _build_reproposal_agent()
    config = _risk_config_for_user(user_address)
    return AgenticLoop(
        risk_pipeline=RiskPipeline(
            [
                AmountRule(
                    swap_pass_threshold=config["swap_amount_threshold_pass"],
                    swap_confirm_threshold=config["swap_amount_threshold_confirm"],
                    transfer_pass_threshold=config["transfer_amount_threshold_pass"],
                    transfer_confirm_threshold=config["transfer_amount_threshold_confirm"],
                ),
                SlippageRule(
                    pass_threshold=config["slippage_threshold_pass"],
                    confirm_threshold=config["slippage_threshold_confirm"],
                ),
                WhitelistRule(custom_whitelist=config["custom_whitelist"]),
                ApprovalRule(),
                FrequencyRule(limit=config["frequency_limit"]),
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


def build_config_store() -> UserConfigStore:
    return UserConfigStore.from_env()


def _risk_config_for_user(user_address: str | None) -> dict[str, Any]:
    if not user_address:
        return build_config_store().get_config("default")["config"]
    return build_config_store().get_config(user_address)["config"]


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
        return validate_agent_output(request.proposal, TxProposal)

    return _demo_proposal_from_intent(request.intent)


def _execute_if_allowed(result, tx_id: str, caw_status: dict[str, Any] | None = None):
    if result.final_decision.decision != "execute":
        return ExecutionResult(
            backend="caw" if caw_status else "mock",
            status="skipped",
            reason="Sentinel rejected before CAW execution.",
        )

    final_tx = result.attempts[-1].tx_proposal
    if caw_status:
        return build_execution_backend(_caw_config_from_status(caw_status)).execute(
            final_tx,
            tx_id,
        )

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


def _input_guard_reject_response(
    request: ExecuteRequest,
    tx_id: str,
    exc: InputGuardError,
    caw_status: dict[str, Any] | None = None,
) -> dict[str, Any]:
    anomalies = exc.anomalies or []
    return {
        "tx_id": tx_id,
        "user_address": request.user_address,
        "intent": request.intent,
        "input_proposal": request.proposal,
        "status": "rejected",
        "decision": "reject",
        "decision_reason": "Input guard rejected transaction.",
        "sentinel_decision": "reject",
        "sentinel_decision_reason": exc.reason,
        "caw": caw_status,
        "attempts": [],
        "decision_chain": {},
        "execution": _execution_to_dict(
            ExecutionResult(
                backend="caw",
                status="skipped",
                reason="Input guard rejected before CAW execution.",
            ),
            caw_status,
        ),
        "security": {
            "code": exc.code,
            "reason": exc.reason,
        },
        "tool_calls": [],
        "memory_anomalies": anomalies,
    }


def _caw_status_for_request(request: ExecuteRequest) -> dict[str, Any] | None:
    if not request.user_address:
        return None

    status = build_wallet_service().get_status(request.user_address)
    readiness, blocking_reason = _caw_readiness(status)
    return {
        **status,
        "readiness": readiness,
        "blocking_reason": blocking_reason,
        "last_refreshed_at": status.get("updated_at"),
    }


def _caw_readiness(status: dict[str, Any]) -> tuple[str, str | None]:
    if status["wallet_status"] == "none":
        return "wallet_required", "No CAW wallet is bound to this user."
    if status["pairing_status"] != "paired":
        return "pairing_required", f"Pairing status is {status['pairing_status']}."
    if status["pact_status"] == "pending_approval":
        return "pact_pending", "Pact status is pending_approval."
    if status["pact_status"] != "active":
        return "pact_required", f"Pact status is {status['pact_status']}."
    if status["wallet_status"] != "active":
        return "pairing_required", f"Wallet status is {status['wallet_status']}."
    return "ready", None


def _caw_not_ready_response(
    request: ExecuteRequest,
    tx_id: str,
    caw_status: dict[str, Any],
) -> dict[str, Any]:
    status = "no_wallet" if caw_status["readiness"] == "wallet_required" else "pact_not_active"
    reason = (
        "Please bind or create a CAW wallet before execution."
        if status == "no_wallet"
        else "CAW Pact is not active."
    )
    return {
        "tx_id": tx_id,
        "user_address": request.user_address,
        "intent": request.intent,
        "input_proposal": request.proposal,
        "status": status,
        "decision": "reject",
        "decision_reason": reason,
        "sentinel_decision": "reject",
        "sentinel_decision_reason": caw_status["blocking_reason"],
        "caw": caw_status,
        "attempts": [],
        "decision_chain": {},
        "execution": _execution_to_dict(
            ExecutionResult(
                backend="caw",
                status="skipped",
                reason=caw_status["blocking_reason"] or reason,
            ),
            caw_status,
        ),
        "security": {"code": None, "reason": None},
        "tool_calls": [],
        "memory_anomalies": [],
    }


def _caw_config_from_status(caw_status: dict[str, Any]):
    from execution import CawConfig

    env_config = CawConfig.from_env()
    return CawConfig(
        api_url=env_config.api_url,
        api_key=env_config.api_key,
        wallet_id=caw_status["caw_wallet_id"],
        pact_id=caw_status["pact_id"],
        chain_id=env_config.chain_id,
        token_id=env_config.token_id,
        src_address=caw_status.get("caw_wallet_address") or env_config.src_address,
        enable_real_tx=env_config.enable_real_tx,
    )


def _execution_to_dict(
    execution: ExecutionResult,
    caw_status: dict[str, Any] | None,
) -> dict[str, Any]:
    data = asdict(execution)
    data["caw_transaction_id"] = execution.tx_id
    data["fallback_reason"] = None
    data["pending_reason"] = None
    data["caw_wallet_id"] = caw_status.get("caw_wallet_id") if caw_status else None
    data["caw_wallet_address"] = (
        caw_status.get("caw_wallet_address") if caw_status else None
    )
    data["pact_id"] = caw_status.get("pact_id") if caw_status else None
    return data


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
