import json
import os
import sqlite3
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_RISK_CONFIG = {
    "swap_amount_threshold_pass": "0.05",
    "swap_amount_threshold_confirm": "0.2",
    "transfer_amount_threshold_pass": "0.02",
    "transfer_amount_threshold_confirm": "0.1",
    "slippage_threshold_pass": 0.03,
    "slippage_threshold_confirm": 0.05,
    "frequency_limit": 3,
    "whitelist_mode": "strict",
    "custom_whitelist": [],
    "auto_approve_low_risk": True,
}


class UserConfigStore:
    def __init__(self, db_path: str | Path | None = None):
        self.db_path = Path(db_path or _default_config_db_path())
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @classmethod
    def from_env(cls):
        return cls(os.getenv("CONFIG_DB_PATH") or None)

    def get_config(self, user_address: str) -> dict[str, Any]:
        normalized = _normalize_user_address(user_address)
        row = self._get_row(normalized)
        if row is None:
            self._insert_default(normalized)
            row = self._get_row(normalized)
        return self._row_to_response(row)

    def update_config(
        self,
        user_address: str,
        updates: dict[str, Any],
    ) -> dict[str, Any]:
        current = self.get_config(user_address)
        config = {**current["config"], **_allowed_updates(updates)}
        return self._save_config(
            user_address=current["user_address"],
            config=config,
            config_version=current["config_version"] + 1,
            pact_config_version=current["pact_config_version"],
            pact_limits_snapshot=current.get("pact_limits_snapshot"),
        )

    def reset_config(self, user_address: str) -> dict[str, Any]:
        current = self.get_config(user_address)
        return self._save_config(
            user_address=current["user_address"],
            config=deepcopy(DEFAULT_RISK_CONFIG),
            config_version=current["config_version"] + 1,
            pact_config_version=current["pact_config_version"],
            pact_limits_snapshot=current.get("pact_limits_snapshot"),
        )

    def mark_pact_synced(
        self,
        user_address: str,
        pact_limits: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        current = self.get_config(user_address)
        snapshot = pact_limits if pact_limits is not None else current["config"]
        return self._save_config(
            user_address=current["user_address"],
            config=current["config"],
            config_version=current["config_version"],
            pact_config_version=current["config_version"],
            pact_limits_snapshot=snapshot,
        )

    def _save_config(
        self,
        user_address: str,
        config: dict[str, Any],
        config_version: int,
        pact_config_version: int,
        pact_limits_snapshot: dict[str, Any] | None,
    ) -> dict[str, Any]:
        now = _now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO user_configs (
                    user_address,
                    config_json,
                    config_version,
                    pact_config_version,
                    pact_limits_snapshot_json,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_address) DO UPDATE SET
                    config_json = excluded.config_json,
                    config_version = excluded.config_version,
                    pact_config_version = excluded.pact_config_version,
                    pact_limits_snapshot_json = excluded.pact_limits_snapshot_json,
                    updated_at = excluded.updated_at
                """,
                (
                    user_address,
                    json.dumps(config, sort_keys=True),
                    config_version,
                    pact_config_version,
                    json.dumps(pact_limits_snapshot or {}, sort_keys=True),
                    now,
                    now,
                ),
            )
        return self.get_config(user_address)

    def _insert_default(self, user_address: str) -> None:
        now = _now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO user_configs (
                    user_address,
                    config_json,
                    config_version,
                    pact_config_version,
                    pact_limits_snapshot_json,
                    created_at,
                    updated_at
                ) VALUES (?, ?, 1, 1, ?, ?, ?)
                """,
                (
                    user_address,
                    json.dumps(DEFAULT_RISK_CONFIG, sort_keys=True),
                    json.dumps(DEFAULT_RISK_CONFIG, sort_keys=True),
                    now,
                    now,
                ),
            )

    def _get_row(self, user_address: str):
        with self._connect() as conn:
            return conn.execute(
                "SELECT * FROM user_configs WHERE user_address = ?",
                (user_address,),
            ).fetchone()

    def _row_to_response(self, row) -> dict[str, Any]:
        config_version = int(row["config_version"])
        pact_config_version = int(row["pact_config_version"])
        return {
            "user_address": row["user_address"],
            "config_status": (
                "synced"
                if config_version == pact_config_version
                else "needs_pact_update"
            ),
            "config_version": config_version,
            "pact_config_version": pact_config_version,
            "config": json.loads(row["config_json"]),
            "pact_limits_snapshot": json.loads(row["pact_limits_snapshot_json"] or "{}"),
        }

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_configs (
                    user_address TEXT PRIMARY KEY,
                    config_json TEXT NOT NULL,
                    config_version INTEGER NOT NULL,
                    pact_config_version INTEGER NOT NULL,
                    pact_limits_snapshot_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn


def _allowed_updates(updates: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in updates.items()
        if key in DEFAULT_RISK_CONFIG
    }


def _default_config_db_path() -> Path:
    return Path(__file__).parent / "data" / "sentinel.db"


def _normalize_user_address(user_address: str) -> str:
    return user_address.strip().lower()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
