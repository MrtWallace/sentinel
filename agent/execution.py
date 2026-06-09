import asyncio
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal, Protocol

from dotenv import load_dotenv

from models import TxProposal


load_dotenv(Path(__file__).resolve().parent / ".env")


ExecutionStatus = Literal[
    "skipped",
    "dry_run",
    "submitted",
    "succeeded",
    "pending",
    "pending_approval",
    "policy_denied",
    "failed",
]


@dataclass
class ExecutionResult:
    backend: str
    status: ExecutionStatus
    request_id: str | None = None
    tx_id: str | None = None
    tx_hash: str | None = None
    reason: str = ""
    policy_reason: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


class ExecutionBackend(Protocol):
    def execute(self, tx: TxProposal, tx_id: str) -> ExecutionResult:
        ...


@dataclass
class CawConfig:
    api_url: str
    api_key: str
    wallet_id: str
    pact_id: str
    chain_id: str = "SETH"
    token_id: str = "SETH"
    src_address: str | None = None
    enable_real_tx: bool = False

    @classmethod
    def from_env(cls):
        return cls(
            api_url=os.getenv("AGENT_WALLET_API_URL", ""),
            api_key=os.getenv("AGENT_WALLET_API_KEY", ""),
            wallet_id=os.getenv("AGENT_WALLET_WALLET_ID", ""),
            pact_id=os.getenv("COBO_PACT_ID", ""),
            chain_id=os.getenv("COBO_CHAIN_ID", "SETH"),
            token_id=os.getenv("COBO_TOKEN_ID", "SETH"),
            src_address=os.getenv("COBO_SRC_ADDRESS") or None,
            enable_real_tx=os.getenv("ENABLE_REAL_TX", "false").lower() == "true",
        )


class MockExecutionBackend:
    def execute(self, tx: TxProposal, tx_id: str) -> ExecutionResult:
        if tx.action == "transfer":
            return ExecutionResult(
                backend="mock",
                status="dry_run",
                request_id=f"mock-{tx_id}",
                reason="Mock execution backend did not submit a transaction.",
                raw={
                    "amount": tx.amount,
                    "recipient": tx.recipient,
                },
            )
        elif tx.action == "swap":
            return ExecutionResult(
                backend="mock",
                status="dry_run",
                request_id=f"mock-{tx_id}",
                reason="Mock execution backend did not submit a swap.",
                raw={
                    "amount": tx.amount,
                    "from_token": tx.from_token,
                    "to_token": tx.to_token,
                    "to_contract": tx.to_contract,
                    "calldata": tx.calldata,
                    "value": tx.value,
                },
            )
        else:
            return ExecutionResult(
                backend="mock",
                status="skipped",
                reason=f"Mock executor does not support action: {tx.action}.",
            )


class CawExecutor:
    def __init__(self, config: CawConfig | None = None, client_factory=None):
        self.config = config or CawConfig.from_env()
        self.client_factory = client_factory or self._default_client_factory

    def execute(self, tx: TxProposal, tx_id: str) -> ExecutionResult:
        request_id = f"sentinel-{tx_id}"

        if tx.action == "transfer":
            return self._execute_transfer(tx, tx_id, request_id)
        elif tx.action == "swap":
            return self._execute_swap(tx, tx_id, request_id)
        else:
            return ExecutionResult(
                backend="caw",
                status="skipped",
                reason=f"CAW executor does not support action: {tx.action}.",
            )

    def _execute_transfer(self, tx: TxProposal, tx_id: str, request_id: str) -> ExecutionResult:
        if not tx.recipient:
            return ExecutionResult(
                backend="caw",
                status="failed",
                reason="Missing transfer recipient.",
            )

        if not self.config.enable_real_tx:
            return ExecutionResult(
                backend="caw",
                status="dry_run",
                request_id=request_id,
                reason="ENABLE_REAL_TX=false; CAW transfer was not submitted.",
                raw=self._transfer_payload(tx, request_id),
            )

        missing = self._missing_real_tx_config()
        if missing:
            return ExecutionResult(
                backend="caw",
                status="failed",
                request_id=request_id,
                reason=f"Missing CAW config: {', '.join(missing)}",
            )

        return asyncio.run(self._execute_real_transfer(tx, request_id))

    def _execute_swap(self, tx: TxProposal, tx_id: str, request_id: str) -> ExecutionResult:
        if not tx.to_contract:
            return ExecutionResult(
                backend="caw",
                status="failed",
                reason="Missing swap target contract.",
            )

        if not tx.calldata:
            return ExecutionResult(
                backend="caw",
                status="failed",
                reason="Missing swap calldata.",
            )

        if not self.config.enable_real_tx:
            return ExecutionResult(
                backend="caw",
                status="dry_run",
                request_id=request_id,
                reason="ENABLE_REAL_TX=false; CAW contract_call was not submitted.",
                raw=self._swap_payload(tx, request_id),
            )

        missing = self._missing_real_tx_config()
        if missing:
            return ExecutionResult(
                backend="caw",
                status="failed",
                request_id=request_id,
                reason=f"Missing CAW config: {', '.join(missing)}",
            )

        return asyncio.run(self._execute_real_swap(tx, request_id))

    async def _execute_real_transfer(
        self,
        tx: TxProposal,
        request_id: str,
    ) -> ExecutionResult:
        try:
            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=self.config.api_key,
            ) as client:
                pact = await client.get_pact(self.config.pact_id)

            pact_api_key = pact.get("api_key") or self.config.api_key
            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=pact_api_key,
            ) as pact_client:
                raw = await self._transfer_with_optional_src_addr(
                    pact_client,
                    tx,
                    request_id,
                )

            return self._result_from_caw_response(raw)
        except Exception as exc:
            if self._is_policy_denied(exc):
                return self._policy_denied_result(exc, request_id)
            return ExecutionResult(
                backend="caw",
                status="failed",
                request_id=request_id,
                reason=str(exc),
            )

    async def _transfer_with_optional_src_addr(
        self,
        client,
        tx: TxProposal,
        request_id: str,
    ):
        kwargs = self._transfer_payload(tx, request_id)
        if self.config.src_address:
            kwargs["src_addr"] = self.config.src_address

        try:
            return await client.transfer_tokens(
                wallet_uuid=self.config.wallet_id,
                **kwargs,
            )
        except TypeError:
            kwargs.pop("src_addr", None)
            return await client.transfer_tokens(
                wallet_uuid=self.config.wallet_id,
                **kwargs,
            )

    def _transfer_payload(self, tx: TxProposal, request_id: str) -> dict[str, Any]:
        return {
            "chain_id": self.config.chain_id,
            "dst_addr": tx.recipient,
            "token_id": self.config.token_id,
            "amount": tx.amount,
            "request_id": request_id,
        }
    def _swap_payload(self, tx: TxProposal, request_id: str) -> dict[str, Any]:
        return {
            "chain_id": self.config.chain_id,
            "contract_addr": tx.to_contract,
            "calldata": tx.calldata,
            "value": tx.value or "0x0",
            "request_id": request_id,
        }

    async def _execute_real_swap(
        self,
        tx: TxProposal,
        request_id: str,
    ) -> ExecutionResult:
        """3-step swap: wrap ETH → WETH, approve router, swap."""
        import asyncio

        try:
            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=self.config.api_key,
            ) as client:
                pact = await client.get_pact(self.config.pact_id)

            pact_api_key = pact.get("api_key") or self.config.api_key

            # Step 1: Wrap ETH to WETH
            wrap_result = await self._wrap_eth_to_weth(pact_api_key, tx, request_id)
            if wrap_result.status == "failed":
                return wrap_result

            # Wait for wrap to complete
            wrap_tx_id = wrap_result.tx_id
            if wrap_result.status != "succeeded" and not await self._wait_for_tx(wrap_tx_id, "Wrap ETH"):
                return ExecutionResult(
                    backend="caw",
                    status="failed",
                    request_id=f"{request_id}-wrap",
                    reason="Wrap ETH transaction failed or timed out.",
                )

            # Step 2: Approve router to spend WETH
            approve_result = await self._approve_router(pact_api_key, tx, request_id)
            if approve_result.status == "failed":
                return approve_result

            # Wait for approve to complete
            approve_tx_id = approve_result.tx_id
            if approve_result.status != "succeeded" and not await self._wait_for_tx(approve_tx_id, "Approve router"):
                return ExecutionResult(
                    backend="caw",
                    status="failed",
                    request_id=f"{request_id}-approve",
                    reason="Approve router transaction failed or timed out.",
                )

            # Step 3: Execute swap
            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=pact_api_key,
            ) as pact_client:
                kwargs = {
                    "wallet_uuid": self.config.wallet_id,
                    "chain_id": self.config.chain_id,
                    "contract_addr": tx.to_contract,
                    "calldata": tx.calldata,
                    "value": "0",  # No ETH value for swap (already wrapped)
                    "request_id": f"{request_id}-swap",
                }
                if self.config.src_address:
                    kwargs["src_addr"] = self.config.src_address
                raw = await pact_client.contract_call(**kwargs)

            return self._result_from_caw_response(raw)
        except Exception as exc:
            if self._is_policy_denied(exc):
                return self._policy_denied_result(exc, request_id)
            return ExecutionResult(
                backend="caw",
                status="failed",
                request_id=request_id,
                reason=str(exc),
            )

    async def _wait_for_tx(self, tx_id: str | None, step_name: str, timeout: int = 120) -> bool:
        """Wait for a transaction to complete. Returns True if successful."""
        import asyncio

        if not tx_id:
            return False

        for i in range(timeout // 5):
            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=self.config.api_key,
            ) as client:
                tx = await client.get_user_transaction_by_uuid(tx_id)
                status = self._raw_caw_status(tx)
                normalized = self._normalize_caw_status(status)

                if normalized == "succeeded":
                    return True
                elif normalized == "failed":
                    return False

            await asyncio.sleep(5)

        return False  # Timeout

    async def _wrap_eth_to_weth(
        self,
        pact_api_key: str,
        tx: TxProposal,
        request_id: str,
    ) -> ExecutionResult:
        """Wrap ETH to WETH using deposit()."""
        try:
            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=pact_api_key,
            ) as pact_client:
                kwargs = {
                    "wallet_uuid": self.config.wallet_id,
                    "chain_id": self.config.chain_id,
                    "contract_addr": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",  # WETH
                    "calldata": "0xd0e30db0",  # deposit()
                    "value": tx.amount,
                    "request_id": f"{request_id}-wrap",
                }
                if self.config.src_address:
                    kwargs["src_addr"] = self.config.src_address
                raw = await pact_client.contract_call(**kwargs)

            return self._result_from_caw_response(raw)
        except Exception as exc:
            if self._is_policy_denied(exc):
                return self._policy_denied_result(exc, f"{request_id}-wrap")
            return ExecutionResult(
                backend="caw",
                status="failed",
                request_id=f"{request_id}-wrap",
                reason=f"Wrap ETH failed: {exc}",
            )

    async def _approve_router(
        self,
        pact_api_key: str,
        tx: TxProposal,
        request_id: str,
    ) -> ExecutionResult:
        """Approve Uniswap router to spend WETH."""
        try:
            # approve(address spender, uint256 amount)
            # spender: Uniswap V3 SwapRouter02
            # amount: MAX_UINT256 (unlimited approval for demo)
            approve_calldata = (
                "0x095ea7b3"  # approve() selector
                + "0000000000000000000000003bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"  # spender
                + "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"  # amount (MAX)
            )

            async with self.client_factory(
                base_url=self.config.api_url,
                api_key=pact_api_key,
            ) as pact_client:
                kwargs = {
                    "wallet_uuid": self.config.wallet_id,
                    "chain_id": self.config.chain_id,
                    "contract_addr": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",  # WETH
                    "calldata": approve_calldata,
                    "value": "0",
                    "request_id": f"{request_id}-approve",
                }
                if self.config.src_address:
                    kwargs["src_addr"] = self.config.src_address
                raw = await pact_client.contract_call(**kwargs)

            return self._result_from_caw_response(raw)
        except Exception as exc:
            if self._is_policy_denied(exc):
                return self._policy_denied_result(exc, f"{request_id}-approve")
            return ExecutionResult(
                backend="caw",
                status="failed",
                request_id=f"{request_id}-approve",
                reason=f"Approve router failed: {exc}",
            )


    def _result_from_caw_response(self, raw: dict[str, Any]) -> ExecutionResult:
        status = self._raw_caw_status(raw)
        normalized_status = self._normalize_caw_status(status)

        return ExecutionResult(
            backend="caw",
            status=normalized_status,
            request_id=raw.get("request_id"),
            tx_id=raw.get("id") or raw.get("cobo_transaction_id"),
            tx_hash=raw.get("transaction_hash"),
            reason=f"CAW status: {status or 'submitted'}",
            raw=raw,
        )

    def _raw_caw_status(self, raw: dict[str, Any]) -> Any:
        return (
            raw.get("status_display")
            or raw.get("status")
            or raw.get("state")
            or raw.get("transaction_status")
            or ""
        )

    def _normalize_caw_status(self, status: Any) -> ExecutionStatus:
        status_text = str(status or "").strip().lower().replace(" ", "_")
        if status_text in ("success", "succeeded", "completed", "complete"):
            return "succeeded"
        if status_text in ("pending_approval", "waiting_approval"):
            return "pending_approval"
        if status_text in ("processing", "pending", "broadcasting", "submitted"):
            return "pending"
        if status_text in ("failed", "fail", "rejected", "cancelled", "canceled", "dropped"):
            return "failed"
        return "submitted"

    def _policy_denied_result(self, exc, request_id: str) -> ExecutionResult:
        denial = getattr(exc, "denial", None)
        details = getattr(denial, "details", {}) if denial else {}
        reason = (
            getattr(denial, "reason", None)
            or getattr(exc, "reason", None)
            or str(exc)
        )
        suggestion = getattr(denial, "suggestion", None) if denial else None

        return ExecutionResult(
            backend="caw",
            status="policy_denied",
            request_id=request_id,
            reason=suggestion or reason,
            policy_reason=reason,
            raw={
                "code": getattr(denial, "code", None) if denial else None,
                "details": details or {},
            },
        )

    def _is_policy_denied(self, exc) -> bool:
        return (
            exc.__class__.__name__ == "PolicyDeniedError"
            or getattr(exc, "status_code", None) == 403
            or hasattr(exc, "denial")
        )

    def _missing_real_tx_config(self) -> list[str]:
        missing = []
        for field_name in ["api_url", "api_key", "wallet_id", "pact_id", "src_address"]:
            if not getattr(self.config, field_name):
                missing.append(field_name)
        return missing

    def _default_client_factory(self, base_url: str, api_key: str):
        try:
            from cobo_agentic_wallet.client import WalletAPIClient
        except ImportError:
            from cobo_agentic_wallet import WalletAPIClient

        return WalletAPIClient(base_url=base_url, api_key=api_key)


def build_execution_backend(config: CawConfig | None = None) -> ExecutionBackend:
    if config is not None:
        return CawExecutor(config=config)

    backend = os.getenv("EXECUTION_BACKEND", "mock").lower()
    if backend == "caw":
        return CawExecutor()
    return MockExecutionBackend()
