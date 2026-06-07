import unittest

from models import TxProposal, RuleResult
from risk.pipeline import RiskPipeline
from risk.rules import AmountRule


class RiskPipelineTest(unittest.TestCase):
    def test_safe_swap_returns_passed_result(self):
        pipeline = RiskPipeline([AmountRule()])
        tx = TxProposal(action="swap", amount="0.01")

        results = pipeline.run(tx)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].rule_name, "AmountRule")
        self.assertEqual(results[0].status, "passed")
    
    def test_risky_swap_returns_rejected_result(self):
        pipeline = RiskPipeline([AmountRule()])
        tx = TxProposal(action="swap", amount="0.3")

        results = pipeline.run(tx)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].status, "rejected")

    def test_pipeline_stops_after_rejected_result(self):
        pipeline = RiskPipeline([
            AlwaysRejectRule(),
            ShouldNotRunRule(),
        ])
        tx = TxProposal(action="swap", amount="0.01")

        results = pipeline.run(tx)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].rule_name, "AlwaysRejectRule")
        self.assertEqual(results[0].status, "rejected")

class AlwaysRejectRule:
    def check(self, tx):
        return RuleResult(
            rule_name="AlwaysRejectRule",
            status="rejected",
            reason="blocked",
            severity="critical",
        )

class ShouldNotRunRule:
    def check(self, tx):
        raise AssertionError("This rule should not run after rejection")