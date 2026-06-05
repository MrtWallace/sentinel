import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class AuditLogger:
    def __init__(self, log_dir: str | Path | None = None):
        self.log_dir = Path(log_dir or _default_log_dir())
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def write(self, record: dict[str, Any]) -> dict[str, Any]:
        tx_id = record["tx_id"]
        enriched = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **record,
        }
        path = self._path_for(tx_id)
        path.write_text(
            json.dumps(enriched, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        return enriched

    def get(self, tx_id: str) -> dict[str, Any] | None:
        path = self._path_for(tx_id)
        if not path.exists():
            return None

        return json.loads(path.read_text(encoding="utf-8"))

    def list(self) -> list[dict[str, Any]]:
        records = []
        for path in sorted(self.log_dir.glob("*.json")):
            record = json.loads(path.read_text(encoding="utf-8"))
            records.append(
                {
                    "tx_id": record.get("tx_id"),
                    "timestamp": record.get("timestamp"),
                    "intent": record.get("intent"),
                    "status": record.get("status"),
                    "decision": record.get("decision"),
                    "sentinel_decision": record.get("sentinel_decision"),
                    "execution_status": record.get("execution", {}).get("status"),
                    "tx_hash": record.get("execution", {}).get("tx_hash"),
                }
            )
        return records

    def _path_for(self, tx_id: str) -> Path:
        return self.log_dir / f"{tx_id}.json"


def _default_log_dir() -> Path:
    return Path(os.getenv("AUDIT_LOG_DIR", Path(__file__).parent / "logs" / "audit"))
