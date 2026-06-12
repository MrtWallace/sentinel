from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from statistics import median
from typing import Any

from audit import AuditLogger
from models import MemoryAnomaly, TxProposal


class MemoryAnalyzer:
    def __init__(
        self,
        audit_logger: AuditLogger | None = None,
        spike_multiplier: Decimal | str = "5",
        minimum_spike_amount: Decimal | str = "0.03",
        frequency_limit: int = 3,
    ):
        self.audit_logger = audit_logger or AuditLogger()
        self.spike_multiplier = Decimal(str(spike_multiplier))
        self.minimum_spike_amount = Decimal(str(minimum_spike_amount))
        self.frequency_limit = frequency_limit

    def analyze(self, user_address: str | None, tx: TxProposal) -> list[MemoryAnomaly]:
        if not user_address:
            return []

        history = self._history_for_user(user_address)
        if not history:
            return []

        anomalies = []
        amount_anomaly = self._amount_spike(history, tx)
        if amount_anomaly:
            anomalies.append(amount_anomaly)

        contract_anomaly = self._new_contract_seen(history, tx)
        if contract_anomaly:
            anomalies.append(contract_anomaly)

        frequency_anomaly = self._frequency_spike(history)
        if frequency_anomaly:
            anomalies.append(frequency_anomaly)

        return anomalies

    def _history_for_user(self, user_address: str) -> list[dict[str, Any]]:
        page = self.audit_logger.list(user_address=user_address, limit=100, offset=0)
        records = []
        for item in page["items"]:
            record = self.audit_logger.get(item["tx_id"])
            if record and record.get("status") == "executed":
                records.append(record)
        return records

    def _amount_spike(
        self,
        history: list[dict[str, Any]],
        tx: TxProposal,
    ) -> MemoryAnomaly | None:
        current = _decimal_or_none(tx.amount)
        if current is None:
            return None

        previous_amounts = [
            amount
            for record in history
            if (amount := _proposal_amount(record, tx.action)) is not None
        ]
        if not previous_amounts:
            return None

        recent_median = Decimal(str(median(previous_amounts)))
        if recent_median <= 0:
            return None

        if current >= self.minimum_spike_amount and current >= recent_median * self.spike_multiplier:
            multiple = (current / recent_median).quantize(Decimal("0.1"))
            return MemoryAnomaly(
                kind="amount_spike_vs_recent_median",
                severity="warning",
                reason=(
                    f"Current {tx.action} amount is {multiple}x the recent median "
                    f"for this user."
                ),
            )
        return None

    def _new_contract_seen(
        self,
        history: list[dict[str, Any]],
        tx: TxProposal,
    ) -> MemoryAnomaly | None:
        current_target = (tx.to_contract or tx.recipient or "").lower()
        if not current_target:
            return None

        previous_targets = {
            target
            for record in history
            if (target := _proposal_target(record)) is not None
        }
        if previous_targets and current_target not in previous_targets:
            return MemoryAnomaly(
                kind="new_contract_seen",
                severity="warning",
                reason=f"First observed interaction with {current_target}.",
            )
        return None

    def _frequency_spike(self, history: list[dict[str, Any]]) -> MemoryAnomaly | None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_count = 0
        for record in history:
            timestamp = _parse_timestamp(record.get("timestamp"))
            if timestamp and timestamp >= cutoff:
                recent_count += 1

        if recent_count >= self.frequency_limit:
            return MemoryAnomaly(
                kind="frequency_spike_24h",
                severity="warning",
                reason=f"{recent_count} executed operations already exist in the last 24h.",
            )
        return None


def _proposal_amount(record: dict[str, Any], action: str) -> Decimal | None:
    proposal = _last_proposal(record)
    if not proposal or proposal.get("action") != action:
        return None
    return _decimal_or_none(proposal.get("amount"))


def _proposal_target(record: dict[str, Any]) -> str | None:
    proposal = _last_proposal(record)
    if not proposal:
        return None
    target = proposal.get("to_contract") or proposal.get("recipient")
    return target.lower() if isinstance(target, str) and target else None


def _last_proposal(record: dict[str, Any]) -> dict[str, Any] | None:
    attempts = record.get("attempts") or []
    if not attempts:
        return None
    proposal = attempts[-1].get("proposal")
    return proposal if isinstance(proposal, dict) else None


def _decimal_or_none(value: Any) -> Decimal | None:
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
