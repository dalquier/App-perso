"""Configuration for the local Pyto Agent Usage companion."""

from __future__ import annotations

from pathlib import Path
import os

APP_VERSION = "0.1.0"
SCHEMA_VERSION = 1
DEFAULT_STALE_AFTER_HOURS = 24
ENV_DATA_DIR = "DEVELOPEROS_AGENT_USAGE_DIR"


def default_data_dir() -> Path:
    """Return the local data directory without creating it.

    Real logs must remain outside GitHub. On iPhone/Pyto the environment variable
    can point to an iCloud folder; otherwise a user-local directory is used.
    """

    configured = os.environ.get(ENV_DATA_DIR)
    if configured:
        return Path(configured).expanduser()
    return Path.home() / "Documents" / "DeveloperOS" / "agent-usage"
