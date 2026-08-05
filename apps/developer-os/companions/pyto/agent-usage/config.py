"""Configuration for the local Pyto Agent Usage companion.

Datetimes are persisted as timezone-aware ISO 8601 strings. Operators should use
Europe/Paris wall time in Pyto; Python's built-in zoneinfo handles that timezone
without an external dependency.
"""

from __future__ import annotations

from pathlib import Path
import os
from zoneinfo import ZoneInfo

APP_VERSION = "0.1.0"
SCHEMA_VERSION = 1
DEFAULT_STALE_AFTER_HOURS = 24
DEFAULT_TIMEZONE = "Europe/Paris"
ENV_DATA_DIR = "DEVELOPEROS_AGENT_USAGE_DIR"


def default_timezone() -> ZoneInfo:
    return ZoneInfo(DEFAULT_TIMEZONE)


def default_data_dir() -> Path:
    configured = os.environ.get(ENV_DATA_DIR)
    if configured:
        return Path(configured).expanduser()
    return Path.home() / "Documents" / "DeveloperOS" / "agent-usage"
