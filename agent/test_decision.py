import unittest
from risk.decision import DecisionEngine
from models import AgentResult, RuleResult, Suggestion


class TestDecision(unittest.TestCase):

    def test_rejects_when_hard_rule_rejected(self):
        hard_rules = [
            RuleResult(rule_name="MaxAmount", status="rejected", reason="Amount exceeds limit"),
            RuleResult(rule_name="Blacklist", status="passed", reason="Not blacklisted"),
        ]
        decision_engine = DecisionEngine()
        decision = decision_engine.decide(hard_rules=hard_rules)
        self.assertEqual(decision.decision, "reject")
        self.assertIn("MaxAmount", decision.reason)

    def test_rejects_when_agent_high_risk_and_keeps_suggestions(self):
        hard_rules = [
            RuleResult(rule_name="MaxAmount", status="passed", reason="Amount within limit"),
        ]
        security_audit = AgentResult(
            agent_name="SecurityAudit",
            passed=False,
            risk_level="high",
            findings=["Suspicious contract interaction"],
            reasoning="The transaction interacts with a known risky contract.",
            suggestions=[Suggestion(field="amount", suggested_value="0.01", reason="Reduce exposure")]
        )
        decision_engine = DecisionEngine()
        decision = decision_engine.decide(hard_rules=hard_rules, security_audit=security_audit)
        self.assertEqual(decision.decision, "reject")
        self.assertIn("SecurityAudit", decision.reason)
        self.assertEqual(len(decision.suggestions), 1)
        self.assertEqual(decision.suggestions[0].field, "amount")
    
    def test_rejects_when_agent_passed_but_high_risk(self):
        hard_rules = [
            RuleResult(rule_name="MaxAmount", status="passed", reason="Amount within limit"),
        ]
        security_audit = AgentResult(
            agent_name="SecurityAudit",
            passed=True,
            risk_level="high",
            findings=["High-risk pattern"],
            reasoning="Risk level is high even though checks passed.",
            suggestions=[Suggestion(field="slippage", suggested_value=0.01, reason="Reduce slippage")],
        )

        decision = DecisionEngine().decide(
            hard_rules=hard_rules,
            security_audit=security_audit,
        )

        self.assertEqual(decision.decision, "reject")
        self.assertEqual(decision.suggestions[0].field, "slippage")

    def test_rejects_when_agent_failed_even_with_low_risk(self):
        hard_rules = [
            RuleResult(rule_name="MaxAmount", status="passed", reason="Amount within limit"),
        ]
        risk_analysis = AgentResult(
            agent_name="RiskAnalysis",
            passed=False,
            risk_level="low",
            findings=["Missing liquidity data"],
            reasoning="Risk analysis could not validate execution safety.",
            suggestions=[Suggestion(field="amount", suggested_value="0.01", reason="Reduce amount")],
        )

        decision = DecisionEngine().decide(
            hard_rules=hard_rules,
            risk_analysis=risk_analysis,
        )

        self.assertEqual(decision.decision, "reject")
        self.assertEqual(decision.suggestions[0].field, "amount")

    def test_confirms_when_hard_rule_requires_confirmation(self):
        hard_rules = [
            RuleResult(rule_name="MaxAmount", status="confirm", reason="Amount close to limit"),
        ]
        decision_engine = DecisionEngine()
        decision = decision_engine.decide(hard_rules=hard_rules)
        self.assertEqual(decision.decision, "confirm")
        self.assertIn("MaxAmount", decision.reason)

    def test_executes_when_rules_and_agents_pass(self):
        hard_rules = [
            RuleResult(rule_name="MaxAmount", status="passed", reason="Amount within limit"),
        ]
        security_audit = AgentResult(
            agent_name="SecurityAudit",
            passed=True,
            risk_level="low",
            findings=[],
            reasoning="No issues found.",
        )
        risk_analysis = AgentResult(
            agent_name="RiskAnalysis",
            passed=True,
            risk_level="low",
            findings=[],
            reasoning="Low risk transaction.",
        )
        decision_engine = DecisionEngine()
        decision = decision_engine.decide(hard_rules=hard_rules, security_audit=security_audit, risk_analysis=risk_analysis)
        self.assertEqual(decision.decision, "execute")
        self.assertIn("meets all criteria", decision.reason)