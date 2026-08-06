"""Pyto/Shortcuts entry point for incremental Google Drive synchronization."""
from __future__ import annotations
import json
from pathlib import Path
from projectos_backup.drive_client import AppsScriptClient, sync_current
from projectos_backup.pyto_access import BackgroundExecution, resolve_folder
from projectos_backup.state import ConfigStore

def main():
    store = ConfigStore(); config = store.load()
    try:
        relay = json.loads((store.directory / "drive.json").read_text(encoding="utf-8"))
        destination = config.get("destinationBookmark")
        if not destination: raise RuntimeError("Destination locale non configurée")
        current = Path(resolve_folder(destination)) / "Current"
        background = BackgroundExecution("ProjectOS Backup vers Drive"); background.begin()
        try:
            result = sync_current(current, AppsScriptClient(relay["url"], relay["token"]))
        finally: background.end()
        print(json.dumps(result, ensure_ascii=False, sort_keys=True)); return 0
    except Exception as exc:
        print(json.dumps({"status": "error", "error": str(exc)}, ensure_ascii=False)); return 1

if __name__ == "__main__": raise SystemExit(main())
