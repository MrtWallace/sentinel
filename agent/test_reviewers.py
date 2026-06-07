import unittest
from reviewers import LLMSecurityAuditor, LLMRiskAnalyst, MockSecurityAuditor, MockRiskAnalyst
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
        self.assertEqual(result.suggestions[0].rejection_code, "amount_too_high")

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
        self.assertEqual(result.suggestions[0].rejection_code, "slippage_too_high")

    def test_llm_risk_analyst_maps_json_to_agent_result(self):
        tx = TxProposal(action="transfer", amount="0.005")
        result = LLMRiskAnalyst(
            FakeLLM(
                {
                    "passed": False,
                    "risk_level": "high",
                    "findings": ["Amount exceeds autonomous comfort zone"],
                    "reasoning": "Reduce the transfer amount.",
                    "suggestions": [
                        {
                            "field": "amount",
                            "suggested_value": "0.001",
                            "reason": "Lower transfer exposure.",
                            "rejection_code": "amount_too_high",
                        }
                    ],
                }
            )
        ).review(tx)

        self.assertFalse(result.passed)
        self.assertEqual(result.risk_level, "high")
        self.assertEqual(result.suggestions[0].rejection_code, "amount_too_high")

    def test_llm_security_auditor_fails_closed_on_invalid_output(self):
        tx = TxProposal(action="transfer", amount="0.001")
        result = LLMSecurityAuditor(FailingLLM()).review(tx)

        self.assertFalse(result.passed)
        self.assertEqual(result.risk_level, "high")
        self.assertIn("failed closed", result.reasoning)

    def test_llm_security_auditor_fails_closed_when_passed_is_not_bool(self):
        tx = TxProposal(action="transfer", amount="0.001")
        result = LLMSecurityAuditor(
            FakeLLM(
                {
                    "passed": "false",
                    "risk_level": "low",
                    "findings": [],
                    "reasoning": "Looks safe.",
                    "suggestions": [],
                }
            )
        ).review(tx)

        self.assertFalse(result.passed)
        self.assertEqual(result.risk_level, "high")


class FakeLLM:
    def __init__(self, response):
        self.response = response

    def complete_json(self, system_prompt, user_prompt):
        return self.response


class FailingLLM:
    def complete_json(self, system_prompt, user_prompt):
        raise ValueError("bad json")
