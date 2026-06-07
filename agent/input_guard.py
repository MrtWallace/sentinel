import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any, Type

from intent import proposal_from_dict
from models import TxProposal


MAX_INTENT_LENGTH = 1200


PROMPT_INJECTION_PATTERNS = [
    r"\bignore\s+(all\s+)?previous\s+instructions\b",
    r"\bdisregard\s+(all\s+)?previous\s+instructions\b",
    r"\bsystem\s+prompt\b",
    r"\bdeveloper\s+message\b",
    r"\breveal\s+(the\s+)?prompt\b",
    r"\boverride\s+(the\s+)?policy\b",
]


@dataclass
class InputGuardError(Exception):
    code: str
    reason: str
    anomalies: list[dict[str, Any]] | None = None

    def __str__(self) -> str:
        return self.reason


def sanitize_user_input(intent: str) -> str:
    if len(intent) > MAX_INTENT_LENGTH:
        raise InputGuardError(
            code="intent_too_long",
            reason=f"Intent exceeds {MAX_INTENT_LENGTH} characters.",
        )

    for char in intent:
        if ord(char) < 32 and char not in {"\n", "\r", "\t"}:
            raise InputGuardError(
                code="invalid_control_character",
                reason="Intent contains invalid control characters.",
            )

    normalized = " ".join(intent.split())
    lowered = normalized.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            raise InputGuardError(
                code="prompt_injection_hint",
                reason="Intent contains prompt injection-like instructions.",
            )

    return normalized


def validate_agent_output(raw_json: dict[str, Any], schema: Type[Any]) -> Any:
    if schema is TxProposal:
        proposal = proposal_from_dict(raw_json)
        if proposal.action == "unknown":
            raise InputGuardError(
                code="invalid_agent_output",
                reason=proposal.reasoning or "Agent output did not match TxProposal.",
            )
        return proposal

    raise InputGuardError(
        code="unsupported_schema",
        reason=f"Unsupported schema: {getattr(schema, '__name__', schema)}.",
    )


def detect_intent_proposal_anomaly(
    intent: str,
    proposal: TxProposal,
) -> list[dict[str, Any]]:
    lowered = intent.lower()
    anomalies: list[dict[str, Any]] = []

    intended_action = _intent_action(lowered)
    if intended_action and proposal.action != intended_action:
        anomalies.append(
            {
                "kind": "action_mismatch",
                "severity": "critical",
                "reason": (
                    f"Intent indicates {intended_action}, "
                    f"but proposal action is {proposal.action}."
                ),
            }
        )

    intended_amount = _first_decimal(lowered)
    proposal_amount = _decimal_or_none(proposal.amount)
    if (
        intended_amount is not None
        and proposal_amount is not None
        and intended_amount != proposal_amount
    ):
        anomalies.append(
            {
                "kind": "amount_mismatch",
                "severity": "critical",
                "reason": (
                    f"Intent amount is {intended_amount}, "
                    f"but proposal amount is {proposal_amount}."
                ),
            }
        )

    intended_address = _first_address(intent)
    proposal_target = proposal.recipient or proposal.to_contract
    if (
        intended_address
        and proposal_target
        and intended_address.lower() != proposal_target.lower()
    ):
        anomalies.append(
            {
                "kind": "target_mismatch",
                "severity": "critical",
                "reason": (
                    f"Intent target is {intended_address}, "
                    f"but proposal target is {proposal_target}."
                ),
            }
        )

    return anomalies


def _intent_action(lowered_intent: str) -> str | None:
    if "swap" in lowered_intent:
        return "swap"
    if "transfer" in lowered_intent or "send" in lowered_intent:
        return "transfer"
    if "approve" in lowered_intent:
        return "approve"
    return None


def _first_decimal(text: str) -> Decimal | None:
    for word in text.replace(",", " ").split():
        parsed = _decimal_or_none(word)
        if parsed is not None:
            return parsed
    return None


def _decimal_or_none(value: Any) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _first_address(text: str) -> str | None:
    match = re.search(r"0x[a-fA-F0-9]{40}", text)
    return match.group(0) if match else None
