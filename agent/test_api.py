import unittest
from unittest.mock import patch
import tempfile

from api import (
    ConfirmRequest,
    CreateWalletRequest,
    ExecuteRequest,
    ExistingWalletRequest,
    PactRequest,
    RefreshWalletStatusRequest,
    confirm,
    connect_existing_wallet,
    create_wallet,
    execute,
    get_audit_log,
    get_wallet_status,
    list_audit_log,
    submit_wallet_pact,
    refresh_wallet_status,
)
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

    def test_execute_can_use_llm_reproposal_mode(self):
        with patch.dict("os.environ", {"REPROPOSAL_MODE": "llm"}):
            with patch("api.build_default_llm_client") as build_llm:
                build_llm.return_value = FakeReproposalLLMClient()

                body = execute(ExecuteRequest(intent="Swap 0.2 ETH to USDC"))

        self.assertEqual(body["status"], "executed")
        self.assertEqual(len(body["attempts"]), 2)
        self.assertEqual(body["attempts"][1]["proposal"]["amount"], "0.01")


class WalletApiTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.env_patcher = patch.dict(
            "os.environ",
            {
                "WALLET_DB_PATH": f"{self.tmpdir.name}/wallets.db",
                "CAW_WALLET_SETUP_MODE": "mock",
            },
        )
        self.env_patcher.start()

    def tearDown(self):
        self.env_patcher.stop()
        self.tmpdir.cleanup()

    def test_wallet_status_returns_unbound_shape(self):
        body = get_wallet_status("0xabc0000000000000000000000000000000000000")

        self.assertEqual(body["wallet_status"], "none")
        self.assertEqual(body["pairing_status"], "none")
        self.assertEqual(body["pact_status"], "none")
        self.assertEqual(body["config_status"], "synced")

    def test_connect_existing_wallet_persists_binding(self):
        body = connect_existing_wallet(
            ExistingWalletRequest(
                user_address="0xabc0000000000000000000000000000000000000",
                caw_wallet_id="wallet_123",
                caw_wallet_address="0xCAW0000000000000000000000000000000000000",
            )
        )

        status = get_wallet_status("0xabc0000000000000000000000000000000000000")

        self.assertEqual(body["wallet_status"], "paired")
        self.assertEqual(status["caw_wallet_id"], "wallet_123")

    def test_create_wallet_persists_pairing_status(self):
        body = create_wallet(
            CreateWalletRequest(
                user_address="0xabc0000000000000000000000000000000000000"
            )
        )

        status = get_wallet_status("0xabc0000000000000000000000000000000000000")

        self.assertEqual(body["wallet_status"], "pairing_pending")
        self.assertEqual(body["pairing_status"], "pending")
        self.assertEqual(status["caw_wallet_id"], body["caw_wallet_id"])
        self.assertEqual(status["wallet_status"], "pairing_pending")

    def test_submit_pact_updates_status(self):
        create_wallet(
            CreateWalletRequest(
                user_address="0xabc0000000000000000000000000000000000000"
            )
        )

        body = submit_wallet_pact(
            PactRequest(
                user_address="0xabc0000000000000000000000000000000000000",
                limits={"frequency_limit": 3},
            )
        )

        self.assertEqual(body["pact_status"], "pending_approval")
        self.assertEqual(body["config_status"], "needs_pact_update")

    def test_refresh_wallet_status_returns_current_binding(self):
        create_wallet(
            CreateWalletRequest(
                user_address="0xabc0000000000000000000000000000000000000"
            )
        )

        body = refresh_wallet_status(
            RefreshWalletStatusRequest(
                user_address="0xabc0000000000000000000000000000000000000"
            )
        )

        self.assertEqual(body["wallet_status"], "pairing_pending")
        self.assertEqual(body["pairing_status"], "pending")


class PolicyDeniedBackend:
    def execute(self, tx, tx_id):
        return ExecutionResult(
            backend="caw",
            status="policy_denied",
            request_id=f"sentinel-{tx_id}",
            reason="Operation denied by the pact's policy.",
            policy_reason="matched_pact_transfer_deny_if",
        )


class FakeReproposalLLMClient:
    def complete_json(self, system_prompt, user_prompt):
        return {
            "action": "swap",
            "amount": "0.01",
            "from_token": "ETH",
            "to_token": "USDC",
            "to_contract": "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
            "slippage": 0.02,
            "deadline": 180,
            "reasoning": "Reduced amount after Sentinel rejection.",
        }
