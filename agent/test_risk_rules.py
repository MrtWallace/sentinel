from datetime import datetime, timedelta, timezone
import unittest

from models import TxProposal
from risk.rules import AmountRule, SlippageRule, WhitelistRule, ApprovalRule, FrequencyRule


class AmountRuleTest(unittest.TestCase):
    def setUp(self):
        self.rule = AmountRule()

    def test_swap_amount_passed(self):
        tx = TxProposal(action="swap", amount="0.01")
        result = self.rule.check(tx)

        self.assertEqual(result.rule_name, "AmountRule")
        self.assertEqual(result.status, "passed")

    def test_swap_amount_confirm(self):
        tx = TxProposal(action="swap", amount="0.08")
        result = self.rule.check(tx)

        self.assertEqual(result.status, "confirm")
        self.assertEqual(result.severity, "warning")

    def test_swap_amount_rejected(self):
        tx = TxProposal(action="swap", amount="0.3")
        result = self.rule.check(tx)

        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

    def test_transfer_amount_passed(self):
        tx = TxProposal(action="transfer", amount="0.01")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")

    def test_transfer_amount_confirm(self):
        tx = TxProposal(action="transfer", amount="0.05")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "confirm")

    def test_transfer_amount_rejected(self):
        tx = TxProposal(action="transfer", amount="0.2")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
    
    def test_invalid_amount_rejected(self):
        tx = TxProposal(action="swap", amount="abc")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

    def test_unknown_action_skipped(self):
        tx = TxProposal(action="unknown", amount="0.01")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "skipped")
    
    def test_swap_amount_boundary_passed_at_005(self):
        tx = TxProposal(action="swap", amount="0.05")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")

    def test_transfer_amount_boundary_passed_at_002(self):
        tx = TxProposal(action="transfer", amount="0.02")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")

class SlippageRuleTest(unittest.TestCase):
    def setUp(self):
        self.rule = SlippageRule()

    def test_slippage_within_limit_passed(self):
        tx = TxProposal(action="swap", amount="0.01", slippage="0.02")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")

    def test_slippage_exceeds_limit_rejected(self):
        tx = TxProposal(action="swap", amount="0.01", slippage="0.08")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")

    def test_slippage_exceeds_limit_confirm(self):
        tx = TxProposal(action="swap", amount="0.01", slippage="0.04")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "confirm")

    def test_slippage_missing_rejected(self):
        tx = TxProposal(action="swap", amount="0.01", slippage=None)
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")

    def test_slippage_non_swap_skipped(self):
        tx = TxProposal(action="transfer", amount="0.01", slippage="0.05")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "skipped")
    
    def test_slippage_non_swap_none_skipped(self):
        tx = TxProposal(action="transfer", amount="0.01", slippage=None)
        result = self.rule.check(tx)
        self.assertEqual(result.status, "skipped")

class WhitelistRuleTest(unittest.TestCase):
    def setUp(self):
        self.rule = WhitelistRule()

    def test_swap_to_whitelisted_contract_passed(self):
        tx = TxProposal(action="swap", amount="0.01", to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")
        self.assertEqual(result.rule_name, "WhitelistRule")

    def test_swap_to_unknown_contract_rejected(self):
        tx = TxProposal(action="swap", amount="0.01", to_contract="0x0e52ee7e9385d3662319DF03f4108Bc0C0469B61")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")
    
    def test_swap_missing_contract_rejected(self):
        tx = TxProposal(action="swap", amount="0.01", to_contract=None)
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

    def test_transfer_skipped(self):
        tx = TxProposal(action="transfer", amount="0.01", to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "skipped")

    def test_swap_to_whitelisted_contract_lowercase_passed(self):
        tx = TxProposal(action="swap", amount="0.01", to_contract="0x3bfa4769fb09eefc5a80d6e87c3b9c650f7ae48e")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")
    
    def test_approve_to_whitelisted_contract_passed(self):
        tx = TxProposal(action="approve", amount="0.01", to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")
    
    def test_approve_to_unknown_contract_rejected(self):
        tx = TxProposal(action="approve", amount="0.01", to_contract="0x0e52ee7e9385d3662319DF03f4108Bc0C0469B61")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

class ApprovalRuleTest(unittest.TestCase):
    def setUp(self):
        self.rule = ApprovalRule()

    def test_approve_with_amount_passed(self):
        tx = TxProposal(action="approve", amount="0.01")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "passed")
        
    def test_approve_over_limit_rejected(self):
        tx = TxProposal(action="approve", amount="2")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")

    def test_approve_with_negative_amount_rejected(self):
        tx = TxProposal(action="approve", amount="-0.01")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
    
    def test_approve_with_non_numeric_amount_rejected(self):
        tx = TxProposal(action="approve", amount="abc")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

    def test_approve_missing_amount_rejected(self):
        tx = TxProposal(action="approve", amount=None)
        result = self.rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

    def test_non_approve_skipped(self):
        tx = TxProposal(action="swap", amount="0.01")
        result = self.rule.check(tx)
        self.assertEqual(result.status, "skipped")


class FrequencyRuleTest(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc)
        self.router = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"

    def _record(self, hours_ago, tx):
        return {
            "timestamp": self.now - timedelta(hours=hours_ago),
            "tx": tx,
        }

    def test_no_history_passed(self):
        rule = FrequencyRule(history=[], now=self.now)
        tx = TxProposal(action="swap", amount="0.01", to_contract=self.router)
        result = rule.check(tx)
        self.assertEqual(result.status, "passed")

    def test_same_target_three_times_in_24h_rejected(self):
        history = [
            self._record(1, TxProposal(action="swap", amount="0.01", to_contract=self.router)),
            self._record(2, TxProposal(action="swap", amount="0.01", to_contract=self.router)),
            self._record(3, TxProposal(action="swap", amount="0.01", to_contract=self.router)),
        ]
        rule = FrequencyRule(history=history, now=self.now)
        tx = TxProposal(action="swap", amount="0.01", to_contract=self.router.lower())
        result = rule.check(tx)
        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.severity, "critical")

    def test_old_history_ignored(self):
        history = [
            self._record(25, TxProposal(action="swap", amount="0.01", to_contract=self.router)),
            self._record(26, TxProposal(action="swap", amount="0.01", to_contract=self.router)),
            self._record(27, TxProposal(action="swap", amount="0.01", to_contract=self.router)),
        ]
        rule = FrequencyRule(history=history, now=self.now)
        tx = TxProposal(action="swap", amount="0.01", to_contract=self.router)
        result = rule.check(tx)
        self.assertEqual(result.status, "passed")

    def test_transfer_uses_recipient(self):
        recipient = "0x000000000000000000000000000000000000dEaD"
        history = [
            self._record(1, TxProposal(action="transfer", amount="0.01", recipient=recipient)),
            self._record(2, TxProposal(action="transfer", amount="0.01", recipient=recipient)),
            self._record(3, TxProposal(action="transfer", amount="0.01", recipient=recipient)),
        ]
        rule = FrequencyRule(history=history, now=self.now)
        tx = TxProposal(action="transfer", amount="0.01", recipient=recipient)
        result = rule.check(tx)
        self.assertEqual(result.status, "rejected")

    def test_unknown_action_skipped(self):
        rule = FrequencyRule(history=[], now=self.now)
        tx = TxProposal(action="unknown", amount="0")
        result = rule.check(tx)
        self.assertEqual(result.status, "skipped")
