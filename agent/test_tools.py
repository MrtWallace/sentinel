import unittest

from models import TxProposal
from tools import AgentToolRegistry


class AgentToolRegistryTest(unittest.TestCase):
    def test_runs_stable_tool_set_for_swap(self):
        tx = TxProposal(
            action="swap",
            amount="0.0005",
            from_token="ETH",
            to_token="USDC",
            to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
            slippage=0.03,
        )

        calls = AgentToolRegistry.default().run_for_review("SecurityAuditor", tx)

        self.assertEqual(calls[0].tool, "check_contract_verified")
        self.assertEqual(calls[0].status, "succeeded")
        self.assertTrue(calls[0].result["verified"])
        self.assertIn("0x3bFA", calls[0].result["address"])

    def test_risk_tools_return_gas_and_price_observations(self):
        tx = TxProposal(
            action="swap",
            amount="0.0005",
            from_token="ETH",
            to_token="USDC",
            to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
            slippage=0.03,
        )

        calls = AgentToolRegistry.default().run_for_review("RiskAnalyst", tx)
        tools = {call.tool: call for call in calls}

        self.assertEqual(tools["check_gas_price"].status, "succeeded")
        self.assertEqual(tools["get_token_price"].result["pair"], "ETH/USDC")


if __name__ == "__main__":
    unittest.main()
