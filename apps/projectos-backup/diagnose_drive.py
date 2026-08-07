"""Fast, read-only Drive relay diagnostic for Pyto."""
from __future__ import annotations

import json
import time

from projectos_backup import drive_client
from projectos_backup.drive_client import AppsScriptClient, preflight_drive
from projectos_backup.state import ConfigStore


def probe(name, operation):
    started = time.monotonic()
    try:
        value = operation()
        return {"test": name, "ok": True, "seconds": round(time.monotonic() - started, 2), "result": value}
    except Exception as exc:
        return {
            "test": name,
            "ok": False,
            "seconds": round(time.monotonic() - started, 2),
            "error": f"{type(exc).__name__}: {exc}",
        }


def preflight_probe(client):
    result = preflight_drive(client)
    return {"status": result["status"], "hasManifest": result["hasManifest"], "attempt": result["attempt"]}


def main():
    store = ConfigStore()
    relay = json.loads((store.directory / "drive.json").read_text(encoding="utf-8"))
    client = AppsScriptClient(relay["url"], relay["token"], timeout=10)
    results = [{
        "test": "version",
        "ok": hasattr(AppsScriptClient, "read"),
        "module": str(drive_client.__file__),
    }]
    results.append(probe("preflight", lambda: preflight_probe(client)))
    print(json.dumps({"projectOSBackupDiagnostic": 1, "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
