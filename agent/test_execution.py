import unittest

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


class ExplodingClientFactory:
    def __call__(self, base_url, api_key):
        raise AssertionError("Client should not be created during dry-run")


class FakeCawClientFactory:
    def __init__(self, transfer_response=None, transfer_error=None):
        self.transfer_response = transfer_response or {}
        self.transfer_error = transfer_error
        self.transfer_kwargs = None

    def __call__(self, base_url, api_key):
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
