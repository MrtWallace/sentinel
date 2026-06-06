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

        self.assertEqual(records["total"], 1)
        self.assertEqual(records["items"][0]["tx_id"], "tx-1")
        self.assertEqual(records["items"][0]["execution_status"], "dry_run")
        self.assertEqual(records["items"][0]["tx_hash"], "0xabc")

    def test_filters_records_by_user_and_status_with_pagination(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            logger = AuditLogger(log_dir=tmpdir)
            logger.write(
                {
                    "tx_id": "tx-1",
                    "user_address": "0xabc",
                    "intent": "Send 0.001 ETH",
                    "status": "executed",
                    "decision": "execute",
                    "sentinel_decision": "execute",
                    "execution": {
                        "backend": "caw",
                        "status": "dry_run",
                        "tx_hash": "0xabc",
                        "caw_wallet_id": "wallet_1",
                        "pact_id": "pact_1",
                    },
                }
            )
            logger.write(
                {
                    "tx_id": "tx-2",
                    "user_address": "0xabc",
                    "intent": "Swap 1 ETH",
                    "status": "rejected",
                    "decision": "reject",
                    "sentinel_decision": "reject",
                    "execution": {"backend": "caw", "status": "skipped"},
                }
            )
            logger.write(
                {
                    "tx_id": "tx-3",
                    "user_address": "0xdef",
                    "intent": "Send 0.001 ETH",
                    "status": "executed",
                    "decision": "execute",
                    "sentinel_decision": "execute",
                    "execution": {"backend": "caw", "status": "dry_run"},
                }
            )

            page = logger.list(user_address="0xabc", status="executed", limit=1, offset=0)

        self.assertEqual(page["total"], 1)
        self.assertEqual(page["limit"], 1)
        self.assertEqual(page["offset"], 0)
        self.assertEqual(page["items"][0]["tx_id"], "tx-1")
        self.assertEqual(page["items"][0]["execution_backend"], "caw")
        self.assertEqual(page["items"][0]["caw_wallet_id"], "wallet_1")
        self.assertEqual(page["items"][0]["pact_id"], "pact_1")

    def test_redacts_sensitive_fields_before_storage(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            logger = AuditLogger(log_dir=tmpdir)

            logger.write(
                {
                    "tx_id": "tx-secret",
                    "intent": "Send 0.001 ETH",
                    "status": "failed",
                    "decision": "reject",
                    "sentinel_decision": "reject",
                    "execution": {
                        "status": "failed",
                        "raw": {
                            "api_key": "secret",
                            "authorization": "Bearer secret",
                            "safe": "kept",
                        },
                    },
                    "headers": {"Authorization": "Bearer secret"},
                }
            )

            record = logger.get("tx-secret")

        self.assertEqual(record["execution"]["raw"]["api_key"], "[REDACTED]")
        self.assertEqual(record["execution"]["raw"]["authorization"], "[REDACTED]")
        self.assertEqual(record["headers"], "[REDACTED]")
        self.assertEqual(record["execution"]["raw"]["safe"], "kept")

    def test_creates_log_directory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            log_dir = Path(tmpdir) / "nested" / "audit"

            AuditLogger(log_dir=log_dir)

            self.assertTrue(log_dir.exists())
