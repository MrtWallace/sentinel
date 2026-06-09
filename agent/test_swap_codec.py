import unittest

from swap_codec import build_swap_proposal, encode_swap_calldata


class SwapCodecTest(unittest.TestCase):
    def test_encodes_swaprouter02_exact_input_single_shape(self):
        calldata, value = encode_swap_calldata(
            from_token="ETH",
            to_token="USDC",
            amount_wei=10**15,
            recipient="0x927f175c85d61237f817b499f739336b498384fe",
            slippage_bps=300,
        )

        self.assertEqual(value, "0")
        self.assertTrue(calldata.startswith("0x04e45aaf"))
        self.assertEqual(len(calldata), 2 + 8 + 7 * 64)

    def test_eth_to_usdc_min_output_uses_usdc_decimals(self):
        calldata, _ = encode_swap_calldata(
            from_token="ETH",
            to_token="USDC",
            amount_wei=10**15,
            recipient="0x927f175c85d61237f817b499f739336b498384fe",
            slippage_bps=300,
        )

        amount_out_min = int(_word(calldata, 5), 16)

        self.assertEqual(amount_out_min, 1_940_000)

    def test_build_swap_proposal_keeps_recipient_in_calldata(self):
        recipient = "0x927f175c85d61237f817b499f739336b498384fe"

        proposal = build_swap_proposal(
            from_token="ETH",
            to_token="USDC",
            amount_eth="0.001",
            recipient=recipient,
        )

        self.assertIn(recipient.lower().replace("0x", ""), proposal["calldata"].lower())
        self.assertEqual(proposal["value"], "0")


def _word(calldata: str, index: int) -> str:
    start = 2 + 8 + index * 64
    return calldata[start:start + 64]


if __name__ == "__main__":
    unittest.main()
