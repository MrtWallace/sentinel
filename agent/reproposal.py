from dataclasses import dataclass, replace
from decimal import Decimal

from models import Suggestion, TxProposal


class MockReproposalAgent:
    def revise(
        self,
        tx: TxProposal,
        suggestions: list[Suggestion],
    ) -> TxProposal:
        revised_tx = tx

        for suggestion in suggestions:
            if suggestion.rejection_code == "amount_too_high":
                revised_tx = replace(
                    revised_tx,
                    amount=str(suggestion.suggested_value),
                )

            elif suggestion.rejection_code == "slippage_too_high":
                revised_tx = replace(
                    revised_tx,
                    slippage=float(suggestion.suggested_value),
                )

            elif suggestion.rejection_code == "deadline_too_long":
                revised_tx = replace(
                    revised_tx,
                    deadline=int(suggestion.suggested_value),
                )

            elif suggestion.rejection_code == "unknown_contract":
                # MVP: 不自动换合约，避免绕过 whitelist
                revised_tx = revised_tx

        return revised_tx


@dataclass
class MutationGuardResult:
    passed: bool
    reason: str


class MutationGuard:
    def __init__(self, allowed_contracts: set[str] | None = None):
        self.allowed_contracts = allowed_contracts or set()

    def validate(
        self,
        old_tx: TxProposal,
        new_tx: TxProposal,
        suggestions: list[Suggestion],
    ) -> MutationGuardResult:
        if old_tx.to_contract != new_tx.to_contract:
            return MutationGuardResult(
                passed=False,
                reason="to_contract cannot be changed during reproposal",
            )
        for suggestion in suggestions:
            if suggestion.rejection_code == "amount_too_high":
                old_amount = Decimal(old_tx.amount)
                new_amount = Decimal(new_tx.amount)

                if new_amount > old_amount * Decimal("0.7"):
                    return MutationGuardResult(
                        passed=False,
                        reason="amount reduction is too small",
                    )
            elif suggestion.rejection_code == "slippage_too_high":
                if old_tx.slippage is None or new_tx.slippage is None:
                    return MutationGuardResult(
                        passed=False,
                        reason="slippage is required for slippage mutation",
                    )

                if new_tx.slippage >= old_tx.slippage:
                    return MutationGuardResult(
                        passed=False,
                        reason="slippage was not reduced",
                    )
            elif suggestion.rejection_code == "deadline_too_long":
                if old_tx.deadline is None or new_tx.deadline is None:
                    return MutationGuardResult(
                        passed=False,
                        reason="deadline is required for deadline mutation",
                    )

                if new_tx.deadline >= old_tx.deadline:
                    return MutationGuardResult(
                        passed=False,
                        reason="deadline was not shortened",
                    )
        return MutationGuardResult(passed=True, reason="mutation accepted")
