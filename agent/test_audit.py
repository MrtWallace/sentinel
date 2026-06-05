import tempfile
import unittest
from pathlib import Path

from audit import AuditLogger


class AuditLoggerTest(unittest.TestCase):
    def test_writes_and_reads_record_by_tx_id(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            logger = AuditLogger(log_dir=tmpdir)
            logger.write(
                {
                    "tx_id": "tx-1",
                    "intent": "Send 0.001 ETH",
                    "status": "executed",
                    "decision": "execute",
                    "sentinel_decision": "execute",
                    "execution": {"status": "dry_run", "tx_hash": None},
                }
            )

            record = logger.get("tx-1")

        self.assertEqual(record["tx_id"], "tx-1")
        self.assertEqual(record["intent"], "Send 0.001 ETH")
        self.assertEqual(record["execution"]["status"], "dry_run")
        self.assertIn("timestamp", record)

    def test_returns_none_for_missing_record(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            logger = AuditLogger(log_dir=tmpdir)

            record = logger.get("missing")

        self.assertIsNone(record)

    def test_lists_summary_records(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            logger = AuditLogger(log_dir=tmpdir)
            logger.write(
                {
                    "tx_id": "tx-1",
                    "intent": "Send 0.001 ETH",
                    "status": "executed",
                    "decision": "execute",
                    "sentinel_decision": "execute",
                    "execution": {"status": "dry_run", "tx_hash": "0xabc"},
                }
            )

            records = logger.list()

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["tx_id"], "tx-1")
        self.assertEqual(records[0]["execution_status"], "dry_run")
        self.assertEqual(records[0]["tx_hash"], "0xabc")

    def test_creates_log_directory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir) / "nested" / "audit"

            AuditLogger(log_dir=log_dir)

            self.assertTrue(log_dir.exists())
