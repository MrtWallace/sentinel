from dataclasses import asdict
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import uuid4

from fastapi import FastAPI
from pydantic import BaseModel, Field

from intent import proposal_from_dict
from loop import AgenticLoop
from models import AgentResult, Suggestion, TxProposal
from reviewers import MockSecurityAuditor
from risk.pipeline import RiskPipeline
from risk.rules import AmountRule, ApprovalRule, FrequencyRule, SlippageRule, WhitelistRule


DEFAULT_SWAP_CONTRACT = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"
DEFAULT_TRANSFER_RECIPIENT = "0x1111111111111111111111111111111111111111"

app = FastAPI(title="Sentinel Backend API", version="0.1.0")


class ExecuteRequest(BaseModel):
    intent: str = Field(default="")
    proposal: dict[str, Any] | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/execute")
def execute(request: ExecuteRequest):
    tx = _proposal_from_request(request)
    loop = _build_loop()
    result = loop.run(tx)
    tx_id = str(uuid4())
    status = _status_from_decision(result.final_decision.decision)

    return {
        "tx_id": tx_id,
        "status": status,
        "decision": result.final_decision.decision,
        "decision_reason": result.final_decision.reason,
        "attempts": [_attempt_to_dict(attempt) for attempt in result.attempts],
        "decision_chain": _legacy_decision_chain(result),
        "execution": {
            "backend": "mock",
            "status": "not_submitted",
            "request_id": None,
            "tx_hash": None,
            "reason": "CP5 minimal API does not submit CAW transactions yet.",
        },
    }


def _build_loop() -> AgenticLoop:
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
        security_auditor=MockSecurityAuditor(mode="safe"),
        risk_analyst=DemoRiskAnalyst(),
    )


def _proposal_from_request(request: ExecuteRequest) -> TxProposal:
    if request.proposal is not None:
        return proposal_from_dict(request.proposal)

    return _demo_proposal_from_intent(request.intent)


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
