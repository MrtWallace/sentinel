from dataclasses import asdict, dataclass, replace
from decimal import Decimal
import json

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


class LLMReproposalAgent:
    def __init__(self, llm_client):
        self.llm_client = llm_client

    def revise(
        self,
        tx: TxProposal,
        suggestions: list[Suggestion],
    ) -> TxProposal:
        try:
            response = self.llm_client.complete_json(
                system_prompt=self._system_prompt(),
                user_prompt=self._user_prompt(tx, suggestions),
            )
            return self._proposal_from_response(response, tx)
        except Exception:
            return tx

    def _system_prompt(self) -> str:
        return """
You are Sentinel Agent A, a risk-aware Web3 transaction planner.
Return only JSON. Do not include markdown.

Your job is to revise a rejected TxProposal so that it becomes less risky.
Allowed changes:
- Lower amount when rejection_code is amount_too_high.
- Lower slippage when rejection_code is slippage_too_high.
- Shorten deadline when rejection_code is deadline_too_long.

Forbidden changes:
- Do not change action.
- Do not change to_contract.
- Do not change recipient.
- Do not increase amount, slippage, or deadline.
- Do not route around Sentinel hard rules.
""".strip()

    def _user_prompt(
        self,
        tx: TxProposal,
        suggestions: list[Suggestion],
    ) -> str:
        payload = {
            "original_tx": asdict(tx),
            "rejection_suggestions": [asdict(suggestion) for suggestion in suggestions],
            "required_output_schema": {
                "action": "swap|transfer|approve|deposit|withdraw|unknown",
                "amount": "decimal string",
                "from_token": "optional string",
                "to_token": "optional string",
                "to_contract": "optional address or null",
                "slippage": "optional number or null",
                "expected_output": "optional string or null",
                "deadline": "optional integer or null",
                "recipient": "optional address or null",
                "reasoning": "short explanation of the lower-risk revision",
            },
        }
        return json.dumps(payload, separators=(",", ":"))

    def _proposal_from_response(self, response: dict, fallback: TxProposal) -> TxProposal:
        if response.get("action") != fallback.action:
            return fallback
        if response.get("to_contract", fallback.to_contract) != fallback.to_contract:
            return fallback
        if response.get("recipient", fallback.recipient) != fallback.recipient:
            return fallback

        return TxProposal(
            action=fallback.action,
            amount=str(response.get("amount", fallback.amount)),
            from_token=response.get("from_token", fallback.from_token),
            to_token=response.get("to_token", fallback.to_token),
            to_contract=response.get("to_contract", fallback.to_contract),
            slippage=self._optional_float(response.get("slippage", fallback.slippage)),
            expected_output=response.get("expected_output", fallback.expected_output),
            deadline=self._optional_int(response.get("deadline", fallback.deadline)),
            reasoning=response.get("reasoning", fallback.reasoning),
            recipient=response.get("recipient", fallback.recipient),
        )

    def _optional_float(self, value):
        if value is None:
            return None
        return float(value)

    def _optional_int(self, value):
        if value is None:
            return None
        return int(value)


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
