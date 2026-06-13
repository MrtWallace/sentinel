import asyncio
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
from execution import CawConfig, CawExecutor, ExecutionResult, build_execution_backend
from input_guard import (
    InputGuardError,
    detect_intent_proposal_anomaly,
    sanitize_user_input,
    validate_agent_output,
)
from llm import build_default_llm_client
from loop import AgenticLoop
from memory import MemoryAnalyzer
from models import AgentResult, DecisionResult, MemoryAnomaly, Suggestion, TxProposal
from reproposal import LLMReproposalAgent
from reviewers import LLMSecurityAuditor, LLMRiskAnalyst, MockSecurityAuditor
from risk.pipeline import RiskPipeline
from risk.rules import AmountRule, ApprovalRule, FrequencyRule, SlippageRule, WhitelistRule
from tools import AgentToolRegistry
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


class PairWalletRequest(BaseModel):
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
    return {
        "status": "ok",
        "execution_backend": os.getenv("EXECUTION_BACKEND", "mock").lower(),
        "real_tx_enabled": os.getenv("ENABLE_REAL_TX", "false").lower() == "true",
    }


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

    if tx.action == "unknown":
        response = _unknown_action_reject_response(request, tx_id)
        build_audit_logger().write(response)
        return response

    caw_status = _caw_status_for_request(request)
    if caw_status is not None and caw_status["readiness"] != "ready":
        response = _caw_not_ready_response(request, tx_id, caw_status)
        build_audit_logger().write(response)
        return response

    loop = _build_loop(request.user_address)
    result = loop.run(tx)
    memory_anomalies = _memory_anomalies_for_result(request.user_address, result)
    _apply_memory_anomalies(result, memory_anomalies)
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
        "tool_calls": _collect_tool_calls(result),
        "memory_anomalies": [asdict(anomaly) for anomaly in memory_anomalies],
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
    logger = build_audit_logger()
    refresh_page = logger.list(
        user_address=user_address,
        status=None,
        limit=limit,
        offset=0,
    )
    for item in refresh_page["items"]:
        record = logger.get(item["tx_id"])
        if record is None:
            continue
        _refresh_caw_audit_record(record, logger)
    return logger.list(
        user_address=user_address,
        status=status,
        limit=limit,
        offset=offset,
    )


@app.get("/api/audit-log/{tx_id}")
def get_audit_log(tx_id: str):
    logger = build_audit_logger()
    record = logger.get(tx_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Audit record not found")
    record, _ = _refresh_caw_audit_record(record, logger)
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


@app.post("/api/wallet/pair-code")
def create_wallet_pairing_code(request: PairWalletRequest):
    try:
        return build_wallet_service().create_pairing_code(request.user_address)
    except WalletNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


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


def _refresh_caw_audit_record(record: dict[str, Any], logger: AuditLogger) -> tuple[dict[str, Any], bool]:
    execution = record.get("execution") or {}
    if not _should_refresh_caw_execution(record, execution):
        return record, False

    caw_tx_id = (
        execution.get("tx_id")
        or execution.get("caw_transaction_id")
        or (execution.get("raw") or {}).get("id")
        or (execution.get("raw") or {}).get("cobo_transaction_id")
    )
    if not caw_tx_id:
        return record, False

    raw = _fetch_caw_transaction(caw_tx_id)
    if not raw:
        return record, False

    refreshed = _apply_caw_transaction_refresh(record, raw)
    logger.write(refreshed)
    return refreshed, True


def _should_refresh_caw_execution(record: dict[str, Any], execution: dict[str, Any]) -> bool:
    if execution.get("backend") != "caw":
        return False
    status = execution.get("status")
    if status in {"pending", "submitted", "pending_approval"}:
        return True
    if status != "failed":
        return False

    raw = execution.get("raw") or {}
    reason = " ".join(
        str(value or "")
        for value in [
            execution.get("reason"),
            record.get("decision_reason"),
            raw.get("status_display"),
        ]
    ).lower()
    return bool(raw.get("timed_out") or "timed out" in reason or "processing" in reason)


def _fetch_caw_transaction(caw_tx_id: str) -> dict[str, Any] | None:
    config = CawConfig.from_env()
    if not config.api_url or not config.api_key:
        return None

    executor = CawExecutor(config=config)

    async def _fetch():
        async with executor.client_factory(
            base_url=config.api_url,
            api_key=config.api_key,
        ) as client:
            return await client.get_user_transaction_by_uuid(caw_tx_id)

    try:
        return asyncio.run(_fetch())
    except Exception:
        return None


def _apply_caw_transaction_refresh(record: dict[str, Any], raw: dict[str, Any]) -> dict[str, Any]:
    execution = dict(record.get("execution") or {})
    previous_raw = execution.get("raw") or {}
    executor = CawExecutor(config=CawConfig.from_env())
    raw_status = executor._raw_caw_status(raw)
    status = executor._normalize_caw_status(raw_status)
    step = previous_raw.get("step") or raw.get("step") or _step_from_request_id(raw.get("request_id"))
    tx_hash = raw.get("transaction_hash") or execution.get("tx_hash")

    execution.update(
        {
            "tx_id": raw.get("id") or raw.get("cobo_transaction_id") or execution.get("tx_id"),
            "caw_transaction_id": raw.get("id") or raw.get("cobo_transaction_id") or execution.get("caw_transaction_id"),
            "request_id": raw.get("request_id") or execution.get("request_id"),
            "tx_hash": tx_hash,
            "raw": {
                **previous_raw,
                **raw,
                "step": step,
                "refreshed_from_caw": True,
            },
        }
    )

    if status == "failed":
        reason = _caw_failure_reason(raw, step)
        execution["status"] = "failed"
        execution["reason"] = reason
        record["status"] = "failed"
        record["decision"] = record.get("decision") or "execute"
        record["decision_reason"] = f"Execution failed: {reason}"
    elif status == "succeeded":
        if step in {"wrap", "approve"}:
            reason = f"CAW {step} transaction succeeded; remaining swap steps were not submitted by this synchronous request."
            execution["status"] = "pending"
            execution["reason"] = reason
            record["status"] = "pending"
            record["decision"] = record.get("decision") or "execute"
            record["decision_reason"] = f"CAW execution pending: {reason}"
        else:
            reason = "CAW transaction succeeded."
            execution["status"] = "succeeded"
            execution["reason"] = reason
            record["status"] = "executed"
            record["decision"] = "execute"
            record["decision_reason"] = reason
    else:
        reason = _caw_pending_reason(raw, step)
        execution["status"] = status
        execution["reason"] = reason
        record["status"] = "pending"
        record["decision"] = record.get("decision") or "execute"
        record["decision_reason"] = f"CAW execution pending: {reason}"

    record["execution"] = execution
    return record


def _step_from_request_id(request_id: Any) -> str | None:
    value = str(request_id or "")
    for step in ("wrap", "approve", "swap"):
        if value.endswith(f"-{step}") or f"-{step}-" in value:
            return step
    return None


def _caw_pending_reason(raw: dict[str, Any], step: str | None) -> str:
    label = f"{step} transaction" if step else "transaction"
    status = raw.get("sub_status") or raw.get("status_display") or raw.get("status") or "processing"
    return f"CAW {label} is still {status}."


def _caw_failure_reason(raw: dict[str, Any], step: str | None) -> str:
    label = f"{step} transaction" if step else "transaction"
    return str(
        raw.get("failed_reason")
        or raw.get("reason")
        or raw.get("error")
        or f"CAW {label} failed."
    )


def _risk_config_for_user(user_address: str | None) -> dict[str, Any]:
    if not user_address:
        return build_config_store().get_config("default")["config"]
    return build_config_store().get_config(user_address)["config"]


def _build_reviewers():
    reviewer_mode = os.getenv("REVIEWER_MODE", "mock").lower()
    tool_registry = AgentToolRegistry.default()
    if reviewer_mode == "llm":
        llm = build_default_llm_client()
        return LLMSecurityAuditor(llm, tool_registry), LLMRiskAnalyst(llm, tool_registry)
    return MockSecurityAuditor(mode="safe", tool_registry=tool_registry), DemoRiskAnalyst(tool_registry)


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
            result.final_decision.decision,
            "failed",
            f"Execution failed: {execution.reason}",
        )

    if execution.status in {"pending", "submitted", "pending_approval"}:
        return (
            result.final_decision.decision,
            "pending",
            f"CAW execution pending: {execution.reason}",
        )

    decision = result.final_decision.decision
    return (
        decision,
        _status_from_decision(decision),
        result.final_decision.reason,
    )


def _unknown_action_reject_response(
    request: ExecuteRequest,
    tx_id: str,
) -> dict[str, Any]:
    return {
        "tx_id": tx_id,
        "user_address": request.user_address or "",
        "intent": request.intent,
        "input_proposal": request.proposal,
        "status": "rejected",
        "decision": "reject",
        "decision_reason": "Could not parse transaction intent. Please rephrase your request.",
        "sentinel_decision": "reject",
        "sentinel_decision_reason": "Could not parse transaction intent. Please rephrase your request.",
        "caw": None,
        "attempts": [],
        "decision_chain": {},
        "execution": _execution_to_dict(
            ExecutionResult(
                backend="none",
                status="skipped",
                reason="Unknown action type.",
            ),
            None,
        ),
        "security": {
            "code": "unknown_action",
            "reason": "Could not parse transaction intent.",
        },
        "tool_calls": [],
        "memory_anomalies": [],
    }


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
    if status.get("caw_healthy") is False:
        return "unavailable", "CAW CLI status reports healthy=false."
    if status.get("wallet_paired") is False:
        return (
            "pairing_required",
            "CAW wallet_paired is false. Generate a pairing code, complete CAW wallet pairing, then refresh status.",
        )
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
    readiness = caw_status["readiness"]
    if readiness == "wallet_required":
        status = "no_wallet"
        reason = "Please bind or create a CAW wallet before execution."
        execution_status = "skipped"
    elif readiness in {"pairing_required", "unavailable"}:
        status = "failed"
        reason = f"CAW preflight blocked execution: {caw_status['blocking_reason']}"
        execution_status = "failed"
    else:
        status = "pact_not_active"
        reason = "CAW Pact is not active."
        execution_status = "skipped"

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
                status=execution_status,
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
        pact_api_key=env_config.pact_api_key,
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


def _extract_first_address(text: str) -> str | None:
    import re
    match = re.search(r"0x[a-fA-F0-9]{40}", text)
    return match.group(0) if match else None


def _demo_proposal_from_intent(intent: str) -> TxProposal:
    lowered = intent.lower().strip()
    amount = _extract_first_decimal(lowered)

    if "transfer" in lowered or "send" in lowered:
        recipient = _extract_first_address(intent)

        if amount is None or recipient is None:
            return TxProposal(
                action="unknown",
                amount="0",
                reasoning="Could not parse explicit amount or recipient from intent.",
            )

        return TxProposal(
            action="transfer",
            amount=str(amount),
            recipient=recipient,
            reasoning="Deterministic demo parser generated a transfer proposal.",
        )

    if "swap" in lowered:
        if amount is None:
            return TxProposal(
                action="unknown",
                amount="0",
                reasoning="Could not parse swap amount from intent.",
            )

        from swap_codec import build_swap_proposal
        recipient = os.getenv("COBO_SRC_ADDRESS") or DEFAULT_TRANSFER_RECIPIENT
        swap_data = build_swap_proposal(
            from_token="ETH",
            to_token="USDC",
            amount_eth=str(amount),
            slippage=0.03,
            recipient=recipient,
        )

        return TxProposal(
            action="swap",
            amount=str(amount),
            from_token="ETH",
            to_token="USDC",
            to_contract=DEFAULT_SWAP_CONTRACT,
            slippage=0.03,
            deadline=300,
            recipient=recipient,
            calldata=swap_data.get("calldata"),
            value=swap_data.get("value"),
            reasoning="Deterministic demo parser generated a swap proposal.",
        )

    return TxProposal(
        action="unknown",
        amount="0",
        reasoning="Intent does not match any supported transaction pattern.",
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


def _collect_tool_calls(result) -> list[dict[str, Any]]:
    calls = []
    for attempt in result.attempts:
        for agent_result in [attempt.security_audit, attempt.risk_analysis]:
            if agent_result:
                calls.extend(asdict(call) for call in agent_result.tool_calls)
    return calls


def _memory_anomalies_for_result(
    user_address: str | None,
    result,
) -> list[MemoryAnomaly]:
    if not result.attempts:
        return []
    final_tx = result.attempts[-1].tx_proposal
    return MemoryAnalyzer(build_audit_logger()).analyze(user_address, final_tx)


def _apply_memory_anomalies(result, anomalies: list[MemoryAnomaly]) -> None:
    if not anomalies:
        return

    confirmation_anomalies = [
        anomaly
        for anomaly in anomalies
        if anomaly.kind in {"amount_spike_vs_recent_median", "new_contract_seen"}
    ]
    final_attempt = result.attempts[-1]
    if final_attempt.risk_analysis:
        final_attempt.risk_analysis.findings.extend(
            f"Memory anomaly: {anomaly.kind} — {anomaly.reason}"
            for anomaly in anomalies
        )
        if confirmation_anomalies and final_attempt.risk_analysis.risk_level == "low":
            final_attempt.risk_analysis.risk_level = "medium"
        if confirmation_anomalies:
            final_attempt.risk_analysis.reasoning = (
                f"{final_attempt.risk_analysis.reasoning} Memory context requires operator confirmation."
            )

    if confirmation_anomalies and result.final_decision.decision == "execute":
        result.final_decision = DecisionResult(
            decision="confirm",
            reason=f"Memory anomaly requires confirmation: {confirmation_anomalies[0].reason}",
            suggestions=[],
        )
        final_attempt.decision = result.final_decision


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
    def __init__(self, tool_registry: AgentToolRegistry | None = None):
        self.tool_registry = tool_registry or AgentToolRegistry.default()

    def review(self, tx: TxProposal) -> AgentResult:
        tool_calls = self.tool_registry.run_for_review("RiskAnalyst", tx)
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
                tool_calls=tool_calls,
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
                tool_calls=tool_calls,
            )

        return AgentResult(
            agent_name="RiskAnalyst",
            passed=True,
            risk_level="low",
            findings=[],
            reasoning="Amount is within autonomous execution limits.",
            tool_calls=tool_calls,
        )
