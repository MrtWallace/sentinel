import unittest
from models import Suggestion, TxProposal
from reproposal import MockReproposalAgent, MutationGuard


class MockReproposalAgentTest(unittest.TestCase):
    def test_revises_amount_from_amount_suggestion(self):
        tx = TxProposal(action="swap", amount="0.2")
        suggestions = [
            Suggestion(
                field="amount",
                suggested_value="0.01",
                reason="Reduce amount",
                rejection_code="amount_too_high",
            )
        ]

        revised = MockReproposalAgent().revise(tx, suggestions)

        self.assertEqual(revised.amount, "0.01")
        self.assertEqual(tx.amount, "0.2")

    def test_revises_slippage_from_slippage_suggestion(self):
        tx = TxProposal(action="swap", amount="0.2", slippage=1.0)
        suggestions = [
            Suggestion(
                field="slippage",
                suggested_value="0.5",
                reason="Reduce slippage",
                rejection_code="slippage_too_high",
            )
        ]

        revised = MockReproposalAgent().revise(tx, suggestions)

        self.assertEqual(revised.slippage, 0.5)
        self.assertEqual(tx.slippage, 1.0)

    def test_ignores_unknown_contract_suggestion(self):
        tx = TxProposal(action="swap", amount="0.2")
        suggestions = [
            Suggestion(
                field="to_contract",
                suggested_value="0x1234567890123456789012345678901234567890",
                reason="Use known contract",
                rejection_code="unknown_contract",
            )
        ]

        revised = MockReproposalAgent().revise(tx, suggestions)

        self.assertEqual(revised.amount, "0.2")

    def test_does_not_revise_to_contract_from_unknown_contract_suggestion(self):
        tx = TxProposal(
            action="swap",
            amount="0.2",
            to_contract="0x1111111111111111111111111111111111111111",
        )
        suggestions = [
            Suggestion(
                field="to_contract",
                suggested_value="0x1111111111111111111111111111111111111111",
                reason="Use known contract",
                rejection_code="unknown_contract",
            )
        ]
        revised = MockReproposalAgent().revise(tx, suggestions)
        self.assertEqual(
            revised.to_contract,
            "0x1111111111111111111111111111111111111111",
        )

    def test_guard_accepts_amount_reduction_by_at_least_30_percent(self):
        old_tx = TxProposal(action="swap", amount="0.2")
        new_tx = TxProposal(action="swap", amount="0.1")
        suggestions = [
            Suggestion(
                field="amount",
                suggested_value="0.1",
                reason="Reduce amount",
                rejection_code="amount_too_high",
            )
        ]

        result = MutationGuard().validate(old_tx, new_tx, suggestions)

        self.assertTrue(result.passed)

    def test_guard_rejects_tiny_amount_reduction(self):
        old_tx = TxProposal(action="swap", amount="0.2")
        new_tx = TxProposal(action="swap", amount="0.19")
        suggestions = [
            Suggestion(
                field="amount",
                suggested_value="0.19",
                reason="Reduce amount",
                rejection_code="amount_too_high",
            )
        ]
        result = MutationGuard().validate(old_tx, new_tx, suggestions)
        self.assertFalse(result.passed)

    def test_guard_slippage_too_high_suggestion_is_ignored(self):
        old_tx = TxProposal(action="swap", amount="0.2", slippage=1.0)
        new_tx = TxProposal(action="swap", amount="0.2", slippage=0.5)
        suggestions = [
            Suggestion(
                field="slippage",
                suggested_value="0.5",
                reason="Reduce slippage",
                rejection_code="slippage_too_high",
            )
        ]
        result = MutationGuard().validate(old_tx, new_tx, suggestions)
        self.assertTrue(result.passed)
    
    def test_guard_accepts_slippage_reduction(self):
        old_tx = TxProposal(action="swap", amount="0.2", deadline=300)
        new_tx = TxProposal(action="swap", amount="0.2", deadline=100)
        suggestions = [
            Suggestion(
                field="deadline",
                suggested_value="100",
                reason="Reduce deadline",
                rejection_code="deadline_too_long",
            )
        ]
        result = MutationGuard().validate(old_tx, new_tx, suggestions)
        self.assertTrue(result.passed)
    
    def test_guard_accepts_deadline_reduction(self):
        old_tx = TxProposal(
            action="swap",
            amount="0.5",
            to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
        )
        new_tx = TxProposal(
            action="swap",
            amount="0.05",
            to_contract="0x111111111111111111111111111111111111111111",
        )
        suggestions = [
            Suggestion(
                field="to_contract",
                suggested_value="0x111111111111111111111111111111111111111111",
                reason="amount too high",
                rejection_code="amount_too_high",
            )
        ]
        result = MutationGuard().validate(old_tx, new_tx, suggestions)
        self.assertFalse(result.passed)