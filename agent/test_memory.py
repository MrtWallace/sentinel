import tempfile
import unittest

from audit import AuditLogger
from memory import MemoryAnalyzer
from models import TxProposal


class MemoryAnalyzerTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.logger = AuditLogger(log_dir=self.tmpdir.name)
        self.user_address = "0xabc0000000000000000000000000000000000000"

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_detects_amount_spike_from_sqlite_audit_history(self):
        self._write_swap_record("0.001", "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")
        self._write_swap_record("0.0015", "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")

        anomalies = MemoryAnalyzer(self.logger).analyze(
            self.user_address,
            TxProposal(
                action="swap",
                amount="0.04",
                from_token="ETH",
                to_token="USDC",
                to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
            ),
        )

        self.assertEqual(anomalies[0].kind, "amount_spike_vs_recent_median")
        self.assertEqual(anomalies[0].severity, "warning")
        self.assertIn("recent median", anomalies[0].reason)

    def test_detects_new_contract_seen_after_user_has_history(self):
        self._write_swap_record("0.001", "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E")

        anomalies = MemoryAnalyzer(self.logger).analyze(
            self.user_address,
            TxProposal(
                action="swap",
                amount="0.001",
                from_token="ETH",
                to_token="USDC",
                to_contract="0x9999999999999999999999999999999999999999",
            ),
        )

        kinds = {anomaly.kind for anomaly in anomalies}
        self.assertIn("new_contract_seen", kinds)

    def _write_swap_record(self, amount, to_contract):
        tx_id = f"history-{amount}-{to_contract[-4:]}"
        self.logger.write(
            {
                "tx_id": tx_id,
                "user_address": self.user_address,
                "intent": f"Swap {amount} ETH to USDC",
                "status": "executed",
                "decision": "execute",
                "decision_reason": "historical execution",
                "sentinel_decision": "execute",
                "attempts": [
                    {
                        "proposal": {
                            "action": "swap",
                            "amount": amount,
                            "from_token": "ETH",
                            "to_token": "USDC",
                            "to_contract": to_contract,
                        }
                    }
                ],
                "execution": {"backend": "mock", "status": "dry_run", "tx_hash": None},
            }
        )


if __name__ == "__main__":
    unittest.main()
