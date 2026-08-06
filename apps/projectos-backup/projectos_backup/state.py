"""Persistent, non-secret application configuration."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import time
import unicodedata


SCHEMA_VERSION = 1
STATE_ENV = "PROJECTOS_BACKUP_STATE_DIR"


def default_state_directory() -> Path:
    configured = os.environ.get(STATE_ENV)
    if configured:
        return Path(configured).expanduser()
    return Path.home() / "Documents" / "ProjectOSBackup"


def _label_key(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", ascii_value.casefold())


def infer_source_label(path: str, suggestions: list[str]) -> str:
    """Return a useful label when iOS exposes an app container as Documents."""
    visible_name = Path(path).name or "Dossier"
    if visible_name.casefold() != "documents":
        return visible_name
    path_key = _label_key(path)
    for suggestion in sorted(suggestions, key=lambda item: len(_label_key(item)), reverse=True):
        key = _label_key(suggestion)
        if key and key in path_key:
            return suggestion
    return visible_name


@dataclass
class SourceConfig:
    source_id: str
    label: str
    bookmark_name: str
    enabled: bool = True
    added_at: str = ""


class ConfigStore:
    def __init__(self, directory: Path | None = None):
        self.directory = directory or default_state_directory()
        self.path = self.directory / "config.json"

    def _default(self) -> dict:
        return {
            "schemaVersion": SCHEMA_VERSION,
            "destinationBookmark": None,
            "sources": [],
            "suggestedLabels": [
                "Pyto", "Pyto data", "Scriptable", "Scriptable Data", "Équilibre",
                "Runestone", "Maestro", "Maestro 2", "Backup Script", "Scripts 260717",
            ],
        }

    def load(self) -> dict:
        if not self.path.exists():
            return self._default()
        payload = json.loads(self.path.read_text(encoding="utf-8"))
        if payload.get("schemaVersion") != SCHEMA_VERSION or not isinstance(payload.get("sources"), list):
            raise ValueError("Configuration ProjectOS Backup incompatible")
        return payload

    def save(self, payload: dict) -> None:
        self.directory.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".json.part")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
        os.replace(temporary, self.path)

    def add_source(self, label: str, bookmark_name: str) -> SourceConfig:
        payload = self.load()
        source = SourceConfig(
            source_id=hashlib.sha256(
                f"{time.time_ns()}:{os.getpid()}:{bookmark_name}".encode("utf-8")
            ).hexdigest()[:32],
            label=label.strip() or "Dossier",
            bookmark_name=bookmark_name,
            enabled=True,
            added_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        )
        payload["sources"].append(asdict(source))
        self.save(payload)
        return source

    def rename_source(self, source_id: str, label: str) -> SourceConfig:
        payload = self.load()
        normalized = label.strip() or "Dossier"
        for raw in payload["sources"]:
            if raw["source_id"] == source_id:
                raw["label"] = normalized
                self.save(payload)
                return SourceConfig(**raw)
        raise KeyError(source_id)

    def remove_source(self, source_id: str) -> SourceConfig:
        payload = self.load()
        for index, raw in enumerate(payload["sources"]):
            if raw["source_id"] == source_id:
                removed = SourceConfig(**payload["sources"].pop(index))
                self.save(payload)
                return removed
        raise KeyError(source_id)

    def toggle_source(self, source_id: str) -> bool:
        payload = self.load()
        for raw in payload["sources"]:
            if raw["source_id"] == source_id:
                raw["enabled"] = not raw.get("enabled", True)
                self.save(payload)
                return raw["enabled"]
        raise KeyError(source_id)

    def set_destination(self, bookmark_name: str) -> str | None:
        payload = self.load()
        previous = payload.get("destinationBookmark")
        payload["destinationBookmark"] = bookmark_name
        self.save(payload)
        return previous

    def sources(self) -> list[SourceConfig]:
        return [SourceConfig(**raw) for raw in self.load()["sources"]]
