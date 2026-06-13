import asyncio
import json
import os
import shutil
import sqlite3
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4


DEFAULT_CONFIG_STATUS = "synced"


@dataclass
class CawWalletProvisioningResult:
    caw_wallet_id: str
    caw_wallet_address: str | None = None
    pairing_url: str | None = None
    expires_at: str | None = None


@dataclass
class PactProvisioningResult:
    pact_id: str
    pact_status: str
    config_status: str = "needs_pact_update"
    pact_limits: dict[str, Any] | None = None


class CawWalletClient(Protocol):
    def create_wallet(self, user_address: str) -> CawWalletProvisioningResult:
        ...

    def submit_pact(
        self,
        wallet: dict[str, Any],
        limits: dict[str, Any],
    ) -> PactProvisioningResult:
        ...

    def create_pairing_code(self, wallet: dict[str, Any]) -> dict[str, Any]:
        ...

    def refresh_status(self, wallet: dict[str, Any]) -> dict[str, Any]:
        ...


class WalletNotFoundError(Exception):
    pass


class UserWalletStore:
    def __init__(self, db_path: str | Path | None = None):
        self.db_path = Path(db_path or _default_wallet_db_path())
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @classmethod
    def from_env(cls):
        return cls(os.getenv("WALLET_DB_PATH") or None)

    def get_status(self, user_address: str) -> dict[str, Any]:
        normalized = _normalize_user_address(user_address)
        wallet = self.get_wallet(normalized)
        if wallet is None:
            return {
                "user_address": normalized,
                "wallet_status": "none",
                "pairing_status": "none",
                "pact_status": "none",
                "config_status": DEFAULT_CONFIG_STATUS,
            }
        return _public_status(wallet)

    def get_wallet(self, user_address: str) -> dict[str, Any] | None:
        normalized = _normalize_user_address(user_address)
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM user_wallets WHERE user_address = ?",
                (normalized,),
            ).fetchone()
        return dict(row) if row else None

    def connect_existing(
        self,
        user_address: str,
        caw_wallet_id: str,
        caw_wallet_address: str | None = None,
    ) -> dict[str, Any]:
        wallet = {
            "user_address": _normalize_user_address(user_address),
            "caw_wallet_id": caw_wallet_id,
            "caw_wallet_address": caw_wallet_address,
            "wallet_status": "paired",
            "pairing_status": "paired",
            "pact_id": None,
            "pact_status": "none",
            "config_status": DEFAULT_CONFIG_STATUS,
            "pairing_url": None,
            "expires_at": None,
            "pact_limits_json": None,
        }
        self._upsert(wallet)
        return self.get_status(user_address)

    def save_created_wallet(
        self,
        user_address: str,
        result: CawWalletProvisioningResult,
    ) -> dict[str, Any]:
        wallet = {
            "user_address": _normalize_user_address(user_address),
            "caw_wallet_id": result.caw_wallet_id,
            "caw_wallet_address": result.caw_wallet_address,
            "wallet_status": "pairing_pending",
            "pairing_status": "pending",
            "pact_id": None,
            "pact_status": "none",
            "config_status": DEFAULT_CONFIG_STATUS,
            "pairing_url": result.pairing_url,
            "expires_at": result.expires_at,
            "pact_limits_json": None,
        }
        self._upsert(wallet)
        return self.get_status(user_address)

    def update_pact(
        self,
        user_address: str,
        result: PactProvisioningResult,
    ) -> dict[str, Any]:
        wallet = self._require_wallet(user_address)
        updates = {
            **wallet,
            "pact_id": result.pact_id,
            "pact_status": result.pact_status,
            "config_status": result.config_status,
            "pact_limits_json": json.dumps(result.pact_limits or {}, sort_keys=True),
        }
        self._upsert(updates)
        return self.get_status(user_address)

    def update_status(
        self,
        user_address: str,
        status: dict[str, Any],
    ) -> dict[str, Any]:
        wallet = self._require_wallet(user_address)
        updates = {**wallet}
        for key in [
            "wallet_status",
            "pairing_status",
            "pact_status",
            "config_status",
            "caw_wallet_address",
            "pact_id",
            "pairing_url",
            "expires_at",
        ]:
            if key in status and status[key] is not None:
                updates[key] = status[key]
        if "pact_limits" in status:
            updates["pact_limits_json"] = json.dumps(
                status["pact_limits"] or {},
                sort_keys=True,
            )
        self._upsert(updates)
        return self.get_status(user_address)

    def _require_wallet(self, user_address: str) -> dict[str, Any]:
        wallet = self.get_wallet(user_address)
        if wallet is None:
            raise WalletNotFoundError(f"No CAW wallet is bound for {user_address}.")
        return wallet

    def _upsert(self, wallet: dict[str, Any]) -> None:
        now = _now_iso()
        existing = self.get_wallet(wallet["user_address"])
        created_at = existing["created_at"] if existing else now
        values = {
            **wallet,
            "created_at": created_at,
            "updated_at": now,
        }
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_wallets (
                    user_address,
                    caw_wallet_id,
                    caw_wallet_address,
                    wallet_status,
                    pairing_status,
                    pact_id,
                    pact_status,
                    config_status,
                    pairing_url,
                    expires_at,
                    pact_limits_json,
                    created_at,
                    updated_at
                ) VALUES (
                    :user_address,
                    :caw_wallet_id,
                    :caw_wallet_address,
                    :wallet_status,
                    :pairing_status,
                    :pact_id,
                    :pact_status,
                    :config_status,
                    :pairing_url,
                    :expires_at,
                    :pact_limits_json,
                    :created_at,
                    :updated_at
                )
                ON CONFLICT(user_address) DO UPDATE SET
                    caw_wallet_id = excluded.caw_wallet_id,
                    caw_wallet_address = excluded.caw_wallet_address,
                    wallet_status = excluded.wallet_status,
                    pairing_status = excluded.pairing_status,
                    pact_id = excluded.pact_id,
                    pact_status = excluded.pact_status,
                    config_status = excluded.config_status,
                    pairing_url = excluded.pairing_url,
                    expires_at = excluded.expires_at,
                    pact_limits_json = excluded.pact_limits_json,
                    updated_at = excluded.updated_at
                """,
                values,
            )

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_wallets (
                    user_address TEXT PRIMARY KEY,
                    caw_wallet_id TEXT NOT NULL,
                    caw_wallet_address TEXT,
                    wallet_status TEXT NOT NULL,
                    pairing_status TEXT NOT NULL,
                    pact_id TEXT,
                    pact_status TEXT NOT NULL,
                    config_status TEXT NOT NULL,
                    pairing_url TEXT,
                    expires_at TEXT,
                    pact_limits_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn


class CawWalletService:
    def __init__(
        self,
        store: UserWalletStore | None = None,
        client: CawWalletClient | None = None,
    ):
        self.store = store or UserWalletStore.from_env()
        self.client = client or build_caw_wallet_client()

    def get_status(self, user_address: str) -> dict[str, Any]:
        wallet = self.store.get_wallet(user_address)
        if wallet is None:
            return self.store.get_status(user_address)
        try:
            status = self.client.refresh_status(wallet)
        except Exception:
            return self.store.get_status(user_address)
        refreshed = self.store.update_status(user_address, status)
        return _merge_realtime_status(refreshed, status)

    def connect_existing(
        self,
        user_address: str,
        caw_wallet_id: str,
        caw_wallet_address: str | None = None,
    ) -> dict[str, Any]:
        return self.store.connect_existing(
            user_address=user_address,
            caw_wallet_id=caw_wallet_id,
            caw_wallet_address=caw_wallet_address,
        )

    def create_wallet(self, user_address: str) -> dict[str, Any]:
        normalized = _normalize_user_address(user_address)
        result = self.client.create_wallet(normalized)
        return self.store.save_created_wallet(normalized, result)

    def submit_pact(
        self,
        user_address: str,
        limits: dict[str, Any],
    ) -> dict[str, Any]:
        wallet = self.store._require_wallet(user_address)
        result = self.client.submit_pact(wallet, limits)
        return self.store.update_pact(user_address, result)

    def create_pairing_code(self, user_address: str) -> dict[str, Any]:
        wallet = self.store._require_wallet(user_address)
        result = self.client.create_pairing_code(wallet)
        return {
            "user_address": wallet["user_address"],
            "caw_wallet_id": wallet["caw_wallet_id"],
            "caw_wallet_address": wallet.get("caw_wallet_address"),
            **result,
        }

    def refresh_status(self, user_address: str) -> dict[str, Any]:
        wallet = self.store._require_wallet(user_address)
        status = self.client.refresh_status(wallet)
        refreshed = self.store.update_status(user_address, status)
        return _merge_realtime_status(refreshed, status)


class MockCawWalletClient:
    def create_wallet(self, user_address: str) -> CawWalletProvisioningResult:
        wallet_id = f"mock-wallet-{uuid4().hex}"
        return CawWalletProvisioningResult(
            caw_wallet_id=wallet_id,
            caw_wallet_address=_mock_address(),
            pairing_url=f"cobo://pair/{wallet_id}",
            expires_at=None,
        )

    def submit_pact(
        self,
        wallet: dict[str, Any],
        limits: dict[str, Any],
    ) -> PactProvisioningResult:
        return PactProvisioningResult(
            pact_id=f"mock-pact-{uuid4().hex}",
            pact_status="pending_approval",
            config_status="needs_pact_update",
            pact_limits=limits,
        )

    def create_pairing_code(self, wallet: dict[str, Any]) -> dict[str, Any]:
        return {
            "caw_wallet_id": wallet["caw_wallet_id"],
            "pairing_code": "12345678",
        }

    def refresh_status(self, wallet: dict[str, Any]) -> dict[str, Any]:
        return {
            "wallet_status": wallet["wallet_status"],
            "pairing_status": wallet["pairing_status"],
            "pact_status": wallet["pact_status"],
            "config_status": wallet["config_status"],
        }


class CawSdkWalletClient:
    def __init__(self):
        self.api_url = os.getenv("AGENT_WALLET_API_URL", "")
        self.api_key = os.getenv("AGENT_WALLET_API_KEY", "")

    def create_wallet(self, user_address: str) -> CawWalletProvisioningResult:
        return asyncio.run(self._create_wallet(user_address))

    def submit_pact(
        self,
        wallet: dict[str, Any],
        limits: dict[str, Any],
    ) -> PactProvisioningResult:
        return asyncio.run(self._submit_pact(wallet, limits))

    def create_pairing_code(self, wallet: dict[str, Any]) -> dict[str, Any]:
        code = self._run_caw_cli_text(["wallet", "pair", "--code-only"]).strip()
        if not code:
            raise RuntimeError("CAW CLI did not return a pairing code.")
        return {
            "caw_wallet_id": wallet["caw_wallet_id"],
            "pairing_code": code,
        }

    def refresh_status(self, wallet: dict[str, Any]) -> dict[str, Any]:
        return asyncio.run(self._refresh_status(wallet))

    async def _create_wallet(self, user_address: str) -> CawWalletProvisioningResult:
        async with self._client() as client:
            raw = await client.create_wallet(metadata={"user_address": user_address})
        return CawWalletProvisioningResult(
            caw_wallet_id=_first_present(raw, "wallet_id", "wallet_uuid", "id"),
            caw_wallet_address=_first_present(raw, "address", "wallet_address"),
            pairing_url=_first_present(raw, "pairing_url", "pair_url"),
            expires_at=_first_present(raw, "expires_at", "expire_at"),
        )

    async def _submit_pact(
        self,
        wallet: dict[str, Any],
        limits: dict[str, Any],
    ) -> PactProvisioningResult:
        async with self._client() as client:
            raw = await client.submit_pact(
                wallet_id=wallet["caw_wallet_id"],
                spec={"limits": limits},
                name="Sentinel risk pact",
            )
        return PactProvisioningResult(
            pact_id=_first_present(raw, "pact_id", "pact_uuid", "id"),
            pact_status=str(_first_present(raw, "pact_status", "status") or "pending_approval"),
            config_status="needs_pact_update",
            pact_limits=limits,
        )

    async def _refresh_status(self, wallet: dict[str, Any]) -> dict[str, Any]:
        async with self._client() as client:
            raw_wallet = await client.get_wallet(wallet["caw_wallet_id"])
            raw_pact = None
            if wallet.get("pact_id"):
                raw_pact = await client.get_pact(wallet["pact_id"])

        pairing_status = _normalize_pairing_status(
            _first_present(raw_wallet, "pairing_status", "status")
        )
        pact_status = wallet["pact_status"]
        if raw_pact:
            pact_status = _normalize_pact_status(
                _first_present(raw_pact, "pact_status", "status")
            )
            expires_at = _first_present(raw_pact, "expires_at", "expire_at")
            if _is_past_timestamp(expires_at) and pact_status == "active":
                pact_status = "expired"
            has_pact_api_key = bool(_first_present(raw_pact, "api_key", "pact_api_key"))
        else:
            expires_at = wallet.get("expires_at")
            has_pact_api_key = bool(os.getenv("COBO_PACT_API_KEY"))
        wallet_status = "active" if pairing_status == "paired" and pact_status == "active" else wallet["wallet_status"]
        cli_status = self._read_cli_status()
        return {
            "wallet_status": wallet_status,
            "pairing_status": pairing_status,
            "pact_status": pact_status,
            "config_status": "synced" if pact_status == "active" else wallet["config_status"],
            "caw_wallet_address": _first_present(raw_wallet, "address", "wallet_address"),
            "expires_at": expires_at,
            "has_pact_api_key": has_pact_api_key,
            "caw_healthy": _first_present(cli_status, "healthy"),
            "wallet_paired": _first_present(cli_status, "wallet_paired"),
            "pending_txs_count": _first_present(cli_status, "pending_txs_count"),
        }

    def _read_cli_status(self) -> dict[str, Any]:
        try:
            output = self._run_caw_cli_text(["status"])
            parsed = json.loads(output)
        except Exception:
            return {}
        return parsed if isinstance(parsed, dict) else {}

    def _run_caw_cli_text(self, args: list[str]) -> str:
        binary = shutil.which("caw")
        if binary is None:
            candidate = Path.home() / ".local" / "bin" / "caw"
            if candidate.exists():
                binary = str(candidate)
        if binary is None:
            raise RuntimeError("CAW CLI is not installed or not on PATH.")

        result = subprocess.run(
            [binary, *args],
            capture_output=True,
            check=False,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise RuntimeError("CAW CLI command failed.")
        return result.stdout

    def _client(self):
        if not self.api_url or not self.api_key:
            raise RuntimeError("Missing AGENT_WALLET_API_URL or AGENT_WALLET_API_KEY.")

        try:
            from cobo_agentic_wallet.client import WalletAPIClient
        except ImportError:
            from cobo_agentic_wallet import WalletAPIClient

        return WalletAPIClient(base_url=self.api_url, api_key=self.api_key)


def build_caw_wallet_client() -> CawWalletClient:
    mode = os.getenv("CAW_WALLET_SETUP_MODE")
    if mode:
        if mode.lower() == "real":
            return CawSdkWalletClient()
        return MockCawWalletClient()

    has_caw_credentials = bool(os.getenv("AGENT_WALLET_API_URL") and os.getenv("AGENT_WALLET_API_KEY"))
    if os.getenv("EXECUTION_BACKEND", "").lower() == "caw" and has_caw_credentials:
        return CawSdkWalletClient()
    return MockCawWalletClient()


def _public_status(wallet: dict[str, Any]) -> dict[str, Any]:
    status = {
        "user_address": wallet["user_address"],
        "wallet_status": wallet["wallet_status"],
        "pairing_status": wallet["pairing_status"],
        "caw_wallet_id": wallet["caw_wallet_id"],
        "pact_status": wallet["pact_status"],
        "config_status": wallet["config_status"],
    }
    for key in [
        "caw_wallet_address",
        "pact_id",
        "pairing_url",
        "expires_at",
        "created_at",
        "updated_at",
    ]:
        if wallet.get(key) is not None:
            status[key] = wallet[key]

    if wallet.get("pact_limits_json"):
        status["pact_limits"] = json.loads(wallet["pact_limits_json"])
    return status


def _merge_realtime_status(
    persisted_status: dict[str, Any],
    realtime_status: dict[str, Any],
) -> dict[str, Any]:
    merged = dict(persisted_status)
    for key in [
        "has_pact_api_key",
        "caw_healthy",
        "wallet_paired",
        "pending_txs_count",
    ]:
        if key in realtime_status and realtime_status[key] is not None:
            merged[key] = realtime_status[key]
    return merged


def _default_wallet_db_path() -> Path:
    return Path(__file__).parent / "data" / "sentinel.db"


def _normalize_user_address(user_address: str) -> str:
    return user_address.strip().lower()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _mock_address() -> str:
    return f"0x{uuid4().hex}{uuid4().hex[:8]}"


def _first_present(source: dict[str, Any], *keys: str) -> Any:
    if source is None:
        return None
    for key in keys:
        if isinstance(source, dict):
            value = source.get(key)
        else:
            value = getattr(source, key, None)
        if value is not None:
            return value
    return None


def _normalize_pairing_status(status: Any) -> str:
    value = str(status or "").lower()
    if value in {"active", "paired", "success"}:
        return "paired"
    if value in {"failed", "rejected"}:
        return "failed"
    return "pending"


def _normalize_pact_status(status: Any) -> str:
    value = str(status or "").lower()
    if value in {"active", "pending_approval", "expired", "revoked", "completed"}:
        return value
    if value in {"success", "approved"}:
        return "active"
    return "pending_approval"


def _is_past_timestamp(timestamp: Any) -> bool:
    if not timestamp:
        return False
    value = str(timestamp).replace("Z", "+00:00")
    try:
        expires_at = datetime.fromisoformat(value)
    except ValueError:
        return False
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= datetime.now(timezone.utc)
