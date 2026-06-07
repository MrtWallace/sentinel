import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SENSITIVE_KEYWORDS = {
    "api_key",
    "authorization",
    "auth",
    "secret",
    "token",
    "credential",
    "private_key",
    "headers",
}


class AuditLogger:
    def __init__(
        self,
        log_dir: str | Path | None = None,
        db_path: str | Path | None = None,
    ):
        self.log_dir = Path(log_dir or _default_log_dir())
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = Path(db_path or _default_db_path(self.log_dir))
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def write(self, record: dict[str, Any]) -> dict[str, Any]:
        tx_id = record["tx_id"]
        enriched = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **record,
        }
        sanitized = _redact(enriched)
        self._write_sqlite(sanitized)
        path = self._path_for(tx_id)
        path.write_text(
            json.dumps(sanitized, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        return sanitized

    def get(self, tx_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT detail_json FROM audit_logs WHERE tx_id = ?",
                (tx_id,),
            ).fetchone()
        if row:
            return json.loads(row["detail_json"])

        path = self._path_for(tx_id)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def list(
        self,
        user_address: str | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        where, params = self._filters(user_address=user_address, status=status)
        limit = max(1, min(int(limit), 100))
        offset = max(0, int(offset))

        with self._connect() as conn:
            total = conn.execute(
                f"SELECT COUNT(*) AS count FROM audit_logs {where}",
                params,
            ).fetchone()["count"]
            rows = conn.execute(
                f"""
                SELECT
                    tx_id,
                    timestamp,
                    user_address,
                    intent,
                    status,
                    decision,
                    decision_reason,
                    sentinel_decision,
                    execution_backend,
                    execution_status,
                    tx_hash,
                    caw_wallet_id,
                    pact_id,
                    policy_reason
                FROM audit_logs
                {where}
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            ).fetchall()

        return {
            "items": [dict(row) for row in rows],
            "limit": limit,
            "offset": offset,
            "total": total,
        }

    def _write_sqlite(self, record: dict[str, Any]) -> None:
        execution = record.get("execution", {}) or {}
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO audit_logs (
                    tx_id,
                    timestamp,
                    user_address,
                    intent,
                    status,
                    decision,
                    decision_reason,
                    sentinel_decision,
                    execution_backend,
                    execution_status,
                    tx_hash,
                    caw_wallet_id,
                    pact_id,
                    policy_reason,
                    attempts_json,
                    execution_json,
                    detail_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(tx_id) DO UPDATE SET
                    timestamp = excluded.timestamp,
                    user_address = excluded.user_address,
                    intent = excluded.intent,
                    status = excluded.status,
                    decision = excluded.decision,
                    decision_reason = excluded.decision_reason,
                    sentinel_decision = excluded.sentinel_decision,
                    execution_backend = excluded.execution_backend,
                    execution_status = excluded.execution_status,
                    tx_hash = excluded.tx_hash,
                    caw_wallet_id = excluded.caw_wallet_id,
                    pact_id = excluded.pact_id,
                    policy_reason = excluded.policy_reason,
                    attempts_json = excluded.attempts_json,
                    execution_json = excluded.execution_json,
                    detail_json = excluded.detail_json
                """,
                (
                    record["tx_id"],
                    record.get("timestamp"),
                    _normalize_user_address(record.get("user_address")),
                    record.get("intent"),
                    record.get("status"),
                    record.get("decision"),
                    record.get("decision_reason"),
                    record.get("sentinel_decision"),
                    execution.get("backend"),
                    execution.get("status"),
                    execution.get("tx_hash"),
                    execution.get("caw_wallet_id"),
                    execution.get("pact_id"),
                    execution.get("policy_reason"),
                    json.dumps(record.get("attempts", []), sort_keys=True),
                    json.dumps(execution, sort_keys=True),
                    json.dumps(record, sort_keys=True),
                ),
            )

    def _filters(self, user_address: str | None, status: str | None):
        clauses = []
        params = []
        if user_address:
            clauses.append("user_address = ?")
            params.append(_normalize_user_address(user_address))
        if status:
            clauses.append("status = ?")
            params.append(status)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        return where, params

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_logs (
                    tx_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    user_address TEXT,
                    intent TEXT,
                    status TEXT,
                    decision TEXT,
                    decision_reason TEXT,
                    sentinel_decision TEXT,
                    execution_backend TEXT,
                    execution_status TEXT,
                    tx_hash TEXT,
                    caw_wallet_id TEXT,
                    pact_id TEXT,
                    policy_reason TEXT,
                    attempts_json TEXT NOT NULL,
                    execution_json TEXT NOT NULL,
                    detail_json TEXT NOT NULL
                )
                """
            )

    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _path_for(self, tx_id: str) -> Path:
        return self.log_dir / f"{tx_id}.json"


def _redact(value: Any, parent_key: str = "") -> Any:
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            if _is_sensitive_key(str(key)):
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = _redact(item, str(key))
        return redacted

    if isinstance(value, list):
        return [_redact(item, parent_key) for item in value]

    if parent_key and _is_sensitive_key(parent_key):
        return "[REDACTED]"

    return value


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    return any(keyword in lowered for keyword in SENSITIVE_KEYWORDS)


def _normalize_user_address(user_address: str | None) -> str | None:
    return user_address.lower() if isinstance(user_address, str) else None


def _default_log_dir() -> Path:
    return Path(os.getenv("AUDIT_LOG_DIR", Path(__file__).parent / "logs" / "audit"))


def _default_db_path(log_dir: Path) -> Path:
    return Path(os.getenv("AUDIT_DB_PATH", log_dir / "audit.db"))
