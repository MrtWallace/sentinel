from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

from models import RuleResult, TxProposal


class AmountRule:
    name = "AmountRule"

    def check(self, tx: TxProposal) -> RuleResult:
        try:
            amount = Decimal(tx.amount)
        except (InvalidOperation, ValueError):
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Invalid amount",
                severity="critical",
            )
        
        if tx.action == "swap":
            if amount > Decimal("0.2"):
                return RuleResult(
                    rule_name=self.name,
                    status="rejected",
                    reason="Swap amount exceeds 0.2 ETH limit",
                    severity="critical",
                )
            if amount > Decimal("0.05"):
                return RuleResult(
                    rule_name=self.name,
                    status="confirm",
                    reason="Swap amount requires confirmation",
                    severity="warning",
                )
            return RuleResult(
                rule_name=self.name,
                status="passed",
                reason="Swap amount within limit",
            )
        if tx.action == "transfer":
            if amount > Decimal("0.1"):
                return RuleResult(
                    rule_name=self.name,
                    status="rejected",
                    reason="Transfer amount exceeds 0.1 ETH limit",
                    severity="critical",
                )
            if amount > Decimal("0.02"):
                return RuleResult(
                    rule_name=self.name,
                    status="confirm",
                    reason="Transfer amount requires confirmation",
                    severity="warning",
                )
            return RuleResult(
                rule_name=self.name,
                status="passed",
                reason="Transfer amount within limit",
            )

        return RuleResult(
            rule_name=self.name,
            status="skipped",
            reason=f"Amount rule does not apply to action: {tx.action}",
        )

class SlippageRule:
    name = "SlippageRule"

    def check(self, tx: TxProposal) -> RuleResult:
        if tx.action != "swap":
            return RuleResult(
                rule_name=self.name,
                status="skipped",
                reason=f"Slippage rule does not apply to action: {tx.action}",
            )

        if tx.slippage is None:
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Missing slippage",
                severity="critical",
            )
            
        try:
            slippage = Decimal(str(tx.slippage))
        except (InvalidOperation, ValueError):
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Invalid slippage",
                severity="critical",
            )
        
        if slippage > Decimal("0.05"):
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Slippage exceeds 5%",
                severity="critical",
            )
        elif slippage <= Decimal("0.03"):
            return RuleResult(
                rule_name=self.name,
                status="passed",
                reason="Slippage within acceptable range",
            )
        else:
            return RuleResult(
                rule_name=self.name,
                status="confirm",
                reason="Slippage requires confirmation",
                severity="warning",
            ) 

class WhitelistRule:
    name = "WhitelistRule"
    WHITELISTED_CONTRACTS = {
        address.lower() 
        for address in [
        "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
        "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
        ]
    }

    def check(self, tx: TxProposal) -> RuleResult:
        if tx.action not in {"swap", "approve"}:
            return RuleResult(
                rule_name=self.name,
                status="skipped",
                reason=f"Whitelist rule does not apply to action: {tx.action}",
            )

        if tx.to_contract is None:
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Missing target contract",
                severity="critical",
            )

        if tx.to_contract.lower() in self.WHITELISTED_CONTRACTS:
            return RuleResult(
                rule_name=self.name,
                status="passed",
                reason="Target contract is whitelisted",
            )
        else:
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Target contract is not whitelisted",
                severity="critical",
            )

class ApprovalRule:
    name = "ApprovalRule"

    def check(self, tx: TxProposal) -> RuleResult:
        if tx.action != "approve":
            return RuleResult(
                rule_name=self.name,
                status="skipped",
                reason=f"Approval rule does not apply to action: {tx.action}",
            )

        if tx.amount is None:
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Missing approval amount",
                severity="critical",
            )

        try:
            amount = Decimal(tx.amount)
        except (InvalidOperation, ValueError):
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Invalid approval amount",
                severity="critical",
            )
        
        if amount < Decimal("0"):
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Approval amount cannot be negative",
                severity="critical",
            )
        elif amount > Decimal("1"):
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Approval amount exceeds limit",
                severity="critical",
            )
        else:
            return RuleResult(
                rule_name=self.name,
                status="passed",
                reason="Approval amount within acceptable range",
            )


class FrequencyRule:
    name = "FrequencyRule"

    def __init__(self, history=None, now=None, limit=3):
        self.history = history or []
        self.now = now or datetime.now(timezone.utc)
        self.limit = limit

    def check(self, tx: TxProposal) -> RuleResult:
        target = self._target_for(tx)
        if target is None:
            return RuleResult(
                rule_name=self.name,
                status="skipped",
                reason=f"Frequency rule does not apply to action: {tx.action}",
            )

        cutoff = self.now - timedelta(hours=24)
        recent_count = 0
        target = target.lower()

        for record in self.history:
            record_time = record.get("timestamp")
            record_tx = record.get("tx")
            if record_time is None or record_tx is None or record_time < cutoff:
                continue

            record_target = self._target_for(record_tx)
            if record_target is not None and record_target.lower() == target:
                recent_count += 1

        if recent_count >= self.limit:
            return RuleResult(
                rule_name=self.name,
                status="rejected",
                reason="Target used too frequently in the last 24 hours",
                severity="critical",
            )

        return RuleResult(
            rule_name=self.name,
            status="passed",
            reason="Target frequency within limit",
        )

    def _target_for(self, tx: TxProposal):
        if tx.action in {"swap", "approve"}:
            return tx.to_contract
        if tx.action == "transfer":
            return tx.recipient
        return None
