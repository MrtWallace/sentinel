import unittest

from intent import proposal_from_dict, parse_tx_proposal
from unittest.mock import patch


class ProposalFromDictTest(unittest.TestCase):
    def test_swap_valid(self):
        proposal = proposal_from_dict({
            "action": "swap",
            "from_token": "eth",
            "to_token": "usdc",
            "amount": "0.01",
        })

        self.assertEqual(proposal.action, "swap")
        self.assertEqual(proposal.from_token, "ETH")
        self.assertEqual(proposal.to_token, "USDC")
        self.assertEqual(proposal.amount, "0.01")

    def test_swap_unknown(self):
        proposal = proposal_from_dict({
            "action": "swap",
            "amount": "0.01",
        })

        self.assertEqual(proposal.action, "unknown")
        self.assertEqual(proposal.reasoning, "Missing fields for swap")
    
    def test_transfer_valid(self):
        proposal = proposal_from_dict({
            "action": "transfer",
            "recipient": "0x123",
            "amount": "0.01",
        })

        self.assertEqual(proposal.action, "transfer")
        self.assertEqual(proposal.recipient, "0x123")
        self.assertEqual(proposal.amount, "0.01")

    def test_transfer_old(self):
        proposal = proposal_from_dict({
            "action": "transfer",
            "to": "0x123",
            "amount_eth": "0.01",
        })

        self.assertEqual(proposal.action, "transfer")
        self.assertEqual(proposal.recipient, "0x123")
        self.assertEqual(proposal.amount, "0.01")

    def test_empty_dict_returns_unknown(self):
        proposal = proposal_from_dict({})
        self.assertEqual(proposal.action, "unknown")

    def test_parse_tx_proposal_uses_parse_intent_result(self):
        with patch("intent.parse_intent") as mock_parse:
            mock_parse.return_value = {
                "action": "swap",
                "from_token": "eth",
                "to_token": "usdc",
                "amount": "0.01",
            }
            proposal = parse_tx_proposal("Swap 0.01 ETH to USDC")

        self.assertEqual(proposal.action, "swap")
        self.assertEqual(proposal.from_token, "ETH")
    

if __name__ == "__main__":
    unittest.main()