import tempfile
import unittest
from unittest.mock import patch

from wallets import (
    CawWalletProvisioningResult,
    CawSdkWalletClient,
    CawWalletService,
    MockCawWalletClient,
    PactProvisioningResult,
    UserWalletStore,
    build_caw_wallet_client,
)


USER = "0xabc0000000000000000000000000000000000000"


class UserWalletStoreTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.store = UserWalletStore(f"{self.tmpdir.name}/wallets.db")

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_status_returns_none_for_unbound_user(self):
        status = self.store.get_status(USER)

        self.assertEqual(status["user_address"], USER.lower())
        self.assertEqual(status["wallet_status"], "none")
        self.assertEqual(status["pairing_status"], "none")
        self.assertEqual(status["pact_status"], "none")
        self.assertEqual(status["config_status"], "synced")

    def test_connect_existing_persists_user_wallet_binding(self):
        self.store.connect_existing(
            user_address=USER,
            caw_wallet_id="wallet_123",
            caw_wallet_address="0xCAW0000000000000000000000000000000000000",
        )

        status = self.store.get_status(USER)

        self.assertEqual(status["wallet_status"], "paired")
        self.assertEqual(status["pairing_status"], "paired")
        self.assertEqual(status["pact_status"], "none")
        self.assertEqual(status["caw_wallet_id"], "wallet_123")
        self.assertEqual(
            status["caw_wallet_address"],
            "0xCAW0000000000000000000000000000000000000",
        )


class CawWalletServiceTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.store = UserWalletStore(f"{self.tmpdir.name}/wallets.db")
        self.client = FakeCawWalletClient()
        self.service = CawWalletService(self.store, self.client)

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_create_wallet_calls_client_and_persists_pairing(self):
        result = self.service.create_wallet(USER)

        self.assertEqual(self.client.created_for, USER.lower())
        self.assertEqual(result["wallet_status"], "pairing_pending")
        self.assertEqual(result["pairing_status"], "pending")
        self.assertEqual(result["caw_wallet_id"], "wallet_456")
        self.assertEqual(result["pairing_url"], "cobo://pair/wallet_456")

        persisted = self.store.get_status(USER)
        self.assertEqual(persisted["wallet_status"], "pairing_pending")
        self.assertEqual(persisted["caw_wallet_id"], "wallet_456")

    def test_submit_pact_persists_pending_approval_status(self):
        self.service.create_wallet(USER)

        result = self.service.submit_pact(
            USER,
            limits={
                "transfer_amount_threshold_confirm": "0.1",
                "swap_amount_threshold_confirm": "0.2",
                "frequency_limit": 3,
            },
        )

        self.assertEqual(result["pact_id"], "pact_456")
        self.assertEqual(result["pact_status"], "pending_approval")
        self.assertEqual(result["config_status"], "needs_pact_update")

        persisted = self.store.get_status(USER)
        self.assertEqual(persisted["pact_id"], "pact_456")
        self.assertEqual(persisted["pact_status"], "pending_approval")
        self.assertEqual(persisted["config_status"], "needs_pact_update")

    def test_refresh_status_updates_pairing_and_pact_from_client(self):
        self.service.create_wallet(USER)
        self.service.submit_pact(USER, limits={})

        result = self.service.refresh_status(USER)

        self.assertEqual(result["wallet_status"], "active")
        self.assertEqual(result["pairing_status"], "paired")
        self.assertEqual(result["pact_status"], "active")
        self.assertEqual(result["config_status"], "synced")

    def test_get_status_refreshes_realtime_pact_status(self):
        self.service.create_wallet(USER)
        self.service.submit_pact(USER, limits={})
        self.client.next_refresh_status = {
            "wallet_status": "active",
            "pairing_status": "paired",
            "pact_status": "completed",
            "config_status": "synced",
            "has_pact_api_key": False,
        }

        result = self.service.get_status(USER)

        self.assertEqual(result["pact_status"], "completed")
        self.assertFalse(result["has_pact_api_key"])

    def test_get_status_exposes_realtime_caw_cli_status(self):
        self.service.create_wallet(USER)
        self.service.submit_pact(USER, limits={})
        self.client.next_refresh_status = {
            "wallet_status": "active",
            "pairing_status": "paired",
            "pact_status": "active",
            "config_status": "synced",
            "caw_healthy": True,
            "wallet_paired": False,
            "pending_txs_count": 3,
        }

        result = self.service.get_status(USER)

        self.assertTrue(result["caw_healthy"])
        self.assertFalse(result["wallet_paired"])
        self.assertEqual(result["pending_txs_count"], 3)

    def test_create_pairing_code_uses_bound_wallet(self):
        self.service.create_wallet(USER)

        result = self.service.create_pairing_code(USER)

        self.assertEqual(result["user_address"], USER.lower())
        self.assertEqual(result["pairing_code"], "12345678")
        self.assertEqual(result["caw_wallet_id"], "wallet_456")


class CawSdkWalletClientTest(unittest.TestCase):
    def test_submit_pact_uses_sdk_submit_pact_method(self):
        client = CawSdkWalletClient()
        fake_sdk = FakeSdkClient()
        client._client = lambda: fake_sdk

        result = client.submit_pact(
            {"caw_wallet_id": "wallet_123"},
            {"frequency_limit": 3},
        )

        self.assertEqual(fake_sdk.submitted["wallet_id"], "wallet_123")
        self.assertEqual(fake_sdk.submitted["spec"], {"limits": {"frequency_limit": 3}})
        self.assertEqual(result.pact_id, "pact_123")
        self.assertEqual(result.pact_status, "pending_approval")

    def test_refresh_status_merges_cli_health_and_pairing_fields(self):
        client = CawSdkWalletClient()
        fake_sdk = FakeSdkClient()
        client._client = lambda: fake_sdk
        client._read_cli_status = lambda: {
            "healthy": True,
            "wallet_paired": False,
            "pending_txs_count": 2,
        }

        result = client.refresh_status(
            {
                "caw_wallet_id": "wallet_123",
                "wallet_status": "paired",
                "pairing_status": "paired",
                "pact_id": "pact_123",
                "pact_status": "active",
                "config_status": "synced",
                "expires_at": None,
            }
        )

        self.assertTrue(result["caw_healthy"])
        self.assertFalse(result["wallet_paired"])
        self.assertEqual(result["pending_txs_count"], 2)

    def test_create_pairing_code_uses_caw_cli_code_only(self):
        client = CawSdkWalletClient()
        client._run_caw_cli_text = lambda args: "87654321\n"

        result = client.create_pairing_code({"caw_wallet_id": "wallet_123"})

        self.assertEqual(result["pairing_code"], "87654321")
        self.assertEqual(result["caw_wallet_id"], "wallet_123")


class BuildCawWalletClientTest(unittest.TestCase):
    def test_defaults_to_mock_without_caw_credentials(self):
        with patch.dict(
            "os.environ",
            {
                "EXECUTION_BACKEND": "caw",
                "AGENT_WALLET_API_URL": "",
                "AGENT_WALLET_API_KEY": "",
                "CAW_WALLET_SETUP_MODE": "",
            },
            clear=False,
        ):
            self.assertIsInstance(build_caw_wallet_client(), MockCawWalletClient)

    def test_uses_real_client_when_caw_execution_has_credentials(self):
        with patch.dict(
            "os.environ",
            {
                "EXECUTION_BACKEND": "caw",
                "AGENT_WALLET_API_URL": "https://api.example.test",
                "AGENT_WALLET_API_KEY": "wallet-key",
            },
            clear=False,
        ):
            with patch.dict("os.environ", {"CAW_WALLET_SETUP_MODE": ""}, clear=False):
                self.assertIsInstance(build_caw_wallet_client(), CawSdkWalletClient)


class FakeCawWalletClient:
    def __init__(self):
        self.created_for = None
        self.next_refresh_status = None

    def create_wallet(self, user_address):
        self.created_for = user_address
        return CawWalletProvisioningResult(
            caw_wallet_id="wallet_456",
            caw_wallet_address="0xCAW0000000000000000000000000000000000000",
            pairing_url="cobo://pair/wallet_456",
            expires_at="2026-06-06T12:00:00Z",
        )

    def submit_pact(self, wallet, limits):
        return PactProvisioningResult(
            pact_id="pact_456",
            pact_status="pending_approval",
            config_status="needs_pact_update",
            pact_limits=limits,
        )

    def create_pairing_code(self, wallet):
        return {
            "caw_wallet_id": wallet["caw_wallet_id"],
            "pairing_code": "12345678",
        }

    def refresh_status(self, wallet):
        if self.next_refresh_status is not None:
            return self.next_refresh_status
        return {
            "wallet_status": "active",
            "pairing_status": "paired",
            "pact_status": "active",
            "config_status": "synced",
        }


class FakeSdkClient:
    def __init__(self):
        self.submitted = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def submit_pact(self, **kwargs):
        self.submitted = kwargs
        return {"id": "pact_123", "status": "pending_approval"}

    async def get_wallet(self, wallet_id):
        return {"id": wallet_id, "status": "active", "address": "0xCAWactive"}

    async def get_pact(self, pact_id):
        return {"id": pact_id, "status": "active", "api_key": "configured"}
