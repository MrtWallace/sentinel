import unittest
from unittest.mock import patch
import tempfile

from api import ConfirmRequest, ExecuteRequest, confirm, execute, get_audit_log, list_audit_log
from execution import ExecutionResult


class ExecuteApiTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.env_patcher = patch.dict(
            "os.environ",
            {
                "EXECUTION_BACKEND": "mock",
                "ENABLE_REAL_TX": "false",
                "AUDIT_LOG_DIR": self.tmpdir.name,
            },
        )
        self.env_patcher.start()

    def tearDown(self):
        self.env_patcher.stop()
        self.tmpdir.cleanup()

    def test_execute_returns_attempts_for_safe_intent(self):
        body = execute(ExecuteRequest(intent="Swap 0.01 ETH to USDC"))

        self.assertEqual(body["status"], "executed")
        self.assertEqual(body["decision"], "execute")
        self.assertEqual(len(body["attempts"]), 1)
        self.assertEqual(body["execution"]["status"], "skipped")

    def test_execute_dry_runs_safe_transfer(self):
        body = execute(ExecuteRequest(intent="Send 0.001 ETH"))

        self.assertEqual(body["status"], "executed")
        self.assertEqual(body["decision"], "execute")
        self.assertEqual(body["attempts"][0]["proposal"]["action"], "transfer")
        self.assertEqual(body["execution"]["backend"], "mock")
        self.assertEqual(body["execution"]["status"], "dry_run")

    def test_execute_writes_audit_record(self):
        body = execute(ExecuteRequest(intent="Send 0.001 ETH"))

        record = get_audit_log(body["tx_id"])

        self.assertEqual(record["tx_id"], body["tx_id"])
        self.assertEqual(record["intent"], "Send 0.001 ETH")
        self.assertEqual(record["execution"]["status"], "dry_run")

    def test_audit_log_list_returns_summary(self):
        body = execute(ExecuteRequest(intent="Send 0.001 ETH"))

        records = list_audit_log()

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["tx_id"], body["tx_id"])
        self.assertEqual(records[0]["execution_status"], "dry_run")

    def test_confirm_records_user_approval(self):
        body = execute(ExecuteRequest(intent="Send 0.001 ETH"))

        record = confirm(ConfirmRequest(tx_id=body["tx_id"], action="approve"))

        self.assertEqual(record["confirmation"]["action"], "approve")
        self.assertEqual(record["confirmation"]["status"], "approved")

    def test_confirm_user_reject_updates_final_decision(self):
        body = execute(ExecuteRequest(intent="Send 0.001 ETH"))

        record = confirm(ConfirmRequest(tx_id=body["tx_id"], action="reject"))

        self.assertEqual(record["status"], "rejected")
        self.assertEqual(record["decision"], "reject")
        self.assertEqual(record["confirmation"]["status"], "rejected")

    def test_execute_retries_when_agent_suggests_safer_amount(self):
        body = execute(ExecuteRequest(intent="Swap 0.2 ETH to USDC"))

        self.assertEqual(body["status"], "executed")
        self.assertEqual(len(body["attempts"]), 2)
        self.assertEqual(body["attempts"][0]["decision"]["decision"], "reject")
        self.assertEqual(body["attempts"][1]["proposal"]["amount"], "0.01")

    def test_execute_rejects_hard_rule_without_retry(self):
        body = execute(ExecuteRequest(intent="Swap 1 ETH to USDC"))

        self.assertEqual(body["status"], "rejected")
        self.assertEqual(len(body["attempts"]), 1)
        self.assertIsNone(body["attempts"][0]["security_audit"])

    def test_execute_returns_rejected_when_execution_policy_denied(self):
        with patch("api.build_execution_backend") as build_backend:
            build_backend.return_value = PolicyDeniedBackend()

            body = execute(ExecuteRequest(intent="Send 0.001 ETH"))

        self.assertEqual(body["status"], "rejected")
        self.assertEqual(body["decision"], "reject")
        self.assertEqual(body["sentinel_decision"], "execute")
        self.assertEqual(body["execution"]["status"], "policy_denied")
        self.assertIn("CAW policy denied", body["decision_reason"])


class PolicyDeniedBackend:
    def execute(self, tx, tx_id):
        return ExecutionResult(
            backend="caw",
            status="policy_denied",
            request_id=f"sentinel-{tx_id}",
            reason="Operation denied by the pact's policy.",
            policy_reason="matched_pact_transfer_deny_if",
        )
