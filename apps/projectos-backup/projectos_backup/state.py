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
DEFAULT_FILTERS = {
    "ignoredDirectories": [".git", "__pycache__", ".pytest_cache", ".mypy_cache"],
    "ignoredFiles": [".DS_Store"],
    "ignoredExtensions": [],
}


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
            "filters": {key: list(value) for key, value in DEFAULT_FILTERS.items()},
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
        if not isinstance(payload.get("filters"), dict):
            payload["filters"] = {key: list(value) for key, value in DEFAULT_FILTERS.items()}
        else:
            for key, value in DEFAULT_FILTERS.items():
                if not isinstance(payload["filters"].get(key), list):
                    payload["filters"][key] = list(value)
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

    def filters(self) -> dict[str, list[str]]:
        payload = self.load()
        return {key: list(payload["filters"].get(key, [])) for key in DEFAULT_FILTERS}

    def set_filters(
        self,
        ignored_directories: list[str],
        ignored_files: list[str],
        ignored_extensions: list[str],
    ) -> dict[str, list[str]]:
        def cleaned(items: list[str], extensions: bool = False) -> list[str]:
            result = []
            for item in items:
                value = str(item).strip()
                if not value:
                    continue
                if extensions and not value.startswith("."):
                    value = f".{value}"
                if value.casefold() not in {entry.casefold() for entry in result}:
                    result.append(value.casefold() if extensions else value)
            return sorted(result, key=str.casefold)

        payload = self.load()
        payload["filters"] = {
            "ignoredDirectories": cleaned(ignored_directories),
            "ignoredFiles": cleaned(ignored_files),
            "ignoredExtensions": cleaned(ignored_extensions, extensions=True),
        }
        self.save(payload)
        return self.filters()
