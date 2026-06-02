import unittest
from reviewers import MockSecurityAuditor, MockRiskAnalyst
from models import TxProposal, RuleResult
from risk.decision import DecisionEngine

class TestReviewers(unittest.TestCase):

    def test_mock_security_auditor_defaults_to_safe(self):
        tx = TxProposal(action="swap", amount="0.1")
        result = MockSecurityAuditor().review(tx)
        self.assertTrue(result.passed)
        self.assertEqual(result.risk_level, "low")
        
    def test_mock_risk_analyst_high_risk_returns_suggestion(self):
        tx = TxProposal(action="swap", amount="1000")
        result = MockRiskAnalyst(mode="high_risk").review(tx)
        self.assertFalse(result.passed)
        self.assertEqual(result.risk_level, "high")
        self.assertEqual(len(result.suggestions), 1)
        self.assertEqual(result.suggestions[0].field, "amount")

    def test_decision_engine_rejects_high_risk_transaction(self):
        tx = TxProposal(action="swap", amount="1000")
        risk_analysis = MockRiskAnalyst(mode="high_risk").review(tx)
        decision = DecisionEngine().decide(
            hard_rules=[
                RuleResult(rule_name="AmountRule", status="passed", reason="ok"),
            ],
            risk_analysis=risk_analysis
        )

        self.assertEqual(decision.decision, "reject")
        self.assertGreater(len(decision.suggestions), 0)
        self.assertEqual(decision.suggestions[0].field, "amount")

    def test_mock_security_auditor_high_risk_returns_suggestion(self):
        tx = TxProposal(action="swap", amount="0.1")
        result = MockSecurityAuditor(mode="high_risk").review(tx)

        self.assertFalse(result.passed)
        self.assertEqual(result.risk_level, "high")
        self.assertEqual(len(result.suggestions), 1)
        self.assertEqual(result.suggestions[0].field, "slippage")