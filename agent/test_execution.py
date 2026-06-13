import unittest
from unittest.mock import patch

from execution import CawConfig, CawExecutor, MockExecutionBackend
from models import TxProposal


class ExecutionBackendTest(unittest.TestCase):
    def test_mock_executor_dry_runs_transfer(self):
        tx = TxProposal(
            action="transfer",
            amount="0.001",
            recipient="0x1111111111111111111111111111111111111111",
        )

        result = MockExecutionBackend().execute(tx, "tx-1")

        self.assertEqual(result.backend, "mock")
        self.assertEqual(result.status, "dry_run")
        self.assertEqual(result.request_id, "mock-tx-1")

    def test_caw_executor_dry_run_does_not_call_client(self):
        tx = TxProposal(
            action="transfer",
            amount="0.001",
            recipient="0x1111111111111111111111111111111111111111",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=False,
        )

        result = CawExecutor(
            config=config,
            client_factory=ExplodingClientFactory(),
        ).execute(tx, "tx-1")

        self.assertEqual(result.backend, "caw")
        self.assertEqual(result.status, "dry_run")
        self.assertEqual(result.request_id, "sentinel-tx-1")
        self.assertEqual(result.raw["amount"], "0.001")

    def test_caw_executor_maps_success_response(self):
        tx = TxProposal(
            action="transfer",
            amount="0.001",
            recipient="0x1111111111111111111111111111111111111111",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=True,
        )
        factory = FakeCawClientFactory(
            transfer_response={
                "id": "caw-tx-id",
                "request_id": "sentinel-tx-1",
                "status": "Success",
                "transaction_hash": "0xabc",
            }
        )

        result = CawExecutor(config=config, client_factory=factory).execute(tx, "tx-1")

        self.assertEqual(result.status, "succeeded")
        self.assertEqual(result.tx_id, "caw-tx-id")
        self.assertEqual(result.tx_hash, "0xabc")
        self.assertEqual(factory.transfer_kwargs["src_addr"], config.src_address)

    def test_caw_executor_uses_status_display_when_status_is_numeric(self):
        tx = TxProposal(
            action="transfer",
            amount="0.001",
            recipient="0x1111111111111111111111111111111111111111",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=True,
        )
        factory = FakeCawClientFactory(
            transfer_response={
                "id": "caw-tx-id",
                "request_id": "sentinel-tx-1",
                "status": 400,
                "status_display": "Processing",
                "transaction_hash": None,
            }
        )

        result = CawExecutor(config=config, client_factory=factory).execute(tx, "tx-1")

        self.assertEqual(result.status, "pending")
        self.assertIn("Processing", result.reason)

    def test_caw_executor_maps_failed_display_status(self):
        executor = CawExecutor(config=CawConfig("", "", "", ""))

        result = executor._result_from_caw_response(
            {
                "id": "caw-tx-id",
                "request_id": "sentinel-tx-1",
                "status_display": "Failed",
                "transaction_hash": None,
            }
        )

        self.assertEqual(result.status, "failed")

    def test_caw_executor_maps_rejected_status_as_failed(self):
        executor = CawExecutor(config=CawConfig("", "", "", ""))

        result = executor._result_from_caw_response(
            {
                "id": "caw-tx-id",
                "request_id": "sentinel-tx-1",
                "status": "Rejected",
                "transaction_hash": None,
            }
        )

        self.assertEqual(result.status, "failed")

    def test_caw_executor_maps_policy_denial(self):
        tx = TxProposal(
            action="transfer",
            amount="0.005",
            recipient="0x1111111111111111111111111111111111111111",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=True,
        )
        factory = FakeCawClientFactory(transfer_error=FakePolicyDeniedError())

        result = CawExecutor(config=config, client_factory=factory).execute(tx, "tx-1")

        self.assertEqual(result.status, "policy_denied")
        self.assertEqual(result.policy_reason, "matched_pact_transfer_deny_if")
        self.assertIn("policy", result.reason)

    def test_caw_executor_fails_fast_without_pact_api_key(self):
        tx = TxProposal(
            action="transfer",
            amount="0.001",
            recipient="0x1111111111111111111111111111111111111111",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=True,
        )
        factory = FakeNoPactKeyCawClientFactory()

        result = CawExecutor(config=config, client_factory=factory).execute(tx, "tx-1")

        self.assertEqual(result.status, "failed")
        self.assertIn("Missing CAW pact API key", result.reason)
        self.assertEqual(result.raw["code"], "MISSING_PACT_API_KEY")

    def test_caw_executor_uses_configured_pact_api_key(self):
        tx = TxProposal(
            action="transfer",
            amount="0.001",
            recipient="0x1111111111111111111111111111111111111111",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            pact_api_key="explicit-pact-key",
            enable_real_tx=True,
        )
        factory = FakeCawClientFactory(
            transfer_response={
                "id": "caw-tx-id",
                "request_id": "sentinel-tx-1",
                "status": "Success",
                "transaction_hash": "0xabc",
            }
        )

        result = CawExecutor(config=config, client_factory=factory).execute(tx, "tx-1")

        self.assertEqual(result.status, "succeeded")
        self.assertEqual(factory.api_keys, ["explicit-pact-key"])

    def test_caw_executor_maps_caw_error_code_as_failed(self):
        executor = CawExecutor(config=CawConfig("", "", "", ""))

        result = executor._result_from_caw_response(
            {
                "code": "INSUFFICIENT_PERMISSION",
                "details": {"required_permission": "can_call_contract"},
            }
        )

        self.assertEqual(result.status, "failed")
        self.assertIn("can_call_contract", result.reason)

    def test_caw_executor_real_swap_aggregates_step_evidence(self):
        tx = TxProposal(
            action="swap",
            amount="0.0005",
            from_token="ETH",
            to_token="USDC",
            to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
            calldata="0x414bf389",
            value="0x1c6bf52634000",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=True,
        )
        factory = FakeSwapCawClientFactory()

        result = CawExecutor(config=config, client_factory=factory).execute(tx, "tx-1")

        self.assertEqual(result.status, "succeeded")
        self.assertEqual(result.tx_hash, "0xswap")
        self.assertEqual(result.raw["wrap_tx"], "0xwrap")
        self.assertEqual(result.raw["approve_tx"], "0xapprove")
        self.assertEqual(result.raw["swap_tx"], "0xswap")
        self.assertEqual(result.raw["block_number"], "11018833")
        self.assertEqual(result.raw["usdc_received"], "5.499668 USDC")
        self.assertTrue(result.raw["real_tx_enabled"])

    def test_caw_executor_returns_pending_when_wrap_is_still_processing(self):
        tx = TxProposal(
            action="swap",
            amount="0.0005",
            from_token="ETH",
            to_token="USDC",
            to_contract="0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
            calldata="0x414bf389",
            value="0x1c6bf52634000",
        )
        config = CawConfig(
            api_url="https://api.agenticwallet.cobo.com",
            api_key="agent-key",
            wallet_id="wallet-id",
            pact_id="pact-id",
            src_address="0x927f175c85d61237f817b499f739336b498384fe",
            enable_real_tx=True,
        )
        factory = FakePendingWrapCawClientFactory()
        executor = CawExecutor(config=config, client_factory=factory)

        async def timed_out(tx_id, step_name, timeout=120):
            return {
                "status": "pending",
                "raw": {
                    "id": "caw-wrap",
                    "request_id": "sentinel-tx-1-wrap",
                    "status_display": "Processing",
                    "transaction_hash": None,
                },
                "timed_out": True,
            }

        with patch.object(executor, "_wait_for_tx", timed_out):
            result = executor.execute(tx, "tx-1")

        self.assertEqual(result.status, "pending")
        self.assertEqual(result.request_id, "sentinel-tx-1-wrap")
        self.assertEqual(result.tx_id, "caw-wrap")
        self.assertEqual(result.reason, "Wrap ETH transaction is still processing after the wait window.")
        self.assertEqual(result.raw["status_display"], "Processing")
        self.assertEqual(result.raw["step"], "wrap")
        self.assertTrue(result.raw["timed_out"])


class ExplodingClientFactory:
    def __call__(self, base_url, api_key):
        raise AssertionError("Client should not be created during dry-run")


class FakeCawClientFactory:
    def __init__(self, transfer_response=None, transfer_error=None):
        self.transfer_response = transfer_response or {}
        self.transfer_error = transfer_error
        self.transfer_kwargs = None
        self.api_keys = []

    def __call__(self, base_url, api_key):
        self.api_keys.append(api_key)
        return FakeCawClient(
            transfer_response=self.transfer_response,
            transfer_error=self.transfer_error,
            factory=self,
        )


class FakeCawClient:
    def __init__(self, transfer_response, transfer_error, factory):
        self.transfer_response = transfer_response
        self.transfer_error = transfer_error
        self.factory = factory

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get_pact(self, pact_id):
        return {"id": pact_id, "status": "active", "api_key": "pact-key"}

    async def transfer_tokens(self, wallet_uuid, **kwargs):
        self.factory.transfer_kwargs = kwargs
        if self.transfer_error:
            raise self.transfer_error
        return self.transfer_response


class FakeNoPactKeyCawClientFactory:
    def __call__(self, base_url, api_key):
        return FakeNoPactKeyCawClient()


class FakeNoPactKeyCawClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get_pact(self, pact_id):
        return {"id": pact_id, "status": "active"}


class FakeSwapCawClientFactory:
    def __init__(self):
        self.calls = []

    def __call__(self, base_url, api_key):
        return FakeSwapCawClient(self)


class FakeSwapCawClient:
    def __init__(self, factory):
        self.factory = factory

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get_pact(self, pact_id):
        return {"id": pact_id, "status": "active", "api_key": "pact-key"}

    async def contract_call(self, **kwargs):
        self.factory.calls.append(kwargs)
        request_id = kwargs["request_id"]
        if request_id.endswith("-wrap"):
            return {
                "id": "caw-wrap",
                "request_id": request_id,
                "status": "Success",
                "transaction_hash": "0xwrap",
            }
        if request_id.endswith("-approve"):
            return {
                "id": "caw-approve",
                "request_id": request_id,
                "status": "Success",
                "transaction_hash": "0xapprove",
            }
        return {
            "id": "caw-swap",
            "request_id": request_id,
            "status": "Success",
            "transaction_hash": "0xswap",
            "block_number": "11018833",
            "usdc_received": "5.499668 USDC",
        }


class FakePendingWrapCawClientFactory:
    def __call__(self, base_url, api_key):
        return FakePendingWrapCawClient()


class FakePendingWrapCawClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get_pact(self, pact_id):
        return {"id": pact_id, "status": "active", "api_key": "pact-key"}

    async def contract_call(self, **kwargs):
        return {
            "id": "caw-wrap",
            "request_id": kwargs["request_id"],
            "status_display": "Processing",
            "transaction_hash": None,
        }


class FakePolicyDeniedError(Exception):
    status_code = 403

    def __init__(self):
        self.denial = FakeDenial()
        super().__init__("policy denied")


class FakeDenial:
    code = "TRANSFER_LIMIT_EXCEEDED"
    reason = "matched_pact_transfer_deny_if"
    details = {"policy_type": "transfer"}
    suggestion = "Operation denied by the pact's policy."
