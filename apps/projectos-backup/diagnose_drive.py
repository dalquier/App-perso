"""Fast, read-only Drive relay diagnostic for Pyto."""
from __future__ import annotations

import json
import time
import urllib.request

from projectos_backup import drive_client
from projectos_backup.drive_client import AppsScriptClient
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


def main():
    store = ConfigStore()
    relay = json.loads((store.directory / "drive.json").read_text(encoding="utf-8"))
    client = AppsScriptClient(relay["url"], relay["token"], timeout=10)
    results = [{
        "test": "version",
        "ok": hasattr(AppsScriptClient, "read"),
        "module": str(drive_client.__file__),
    }]
    results.append(probe(
        "public_get",
        lambda: json.loads(urllib.request.urlopen(client.url, timeout=10).read().decode("utf-8")),
    ))
    if hasattr(client, "read"):
        results.append(probe("signed_manifest_get", lambda: {"hasManifest": client.read("manifest").get("manifest") is not None}))
    else:
        results.append({"test": "signed_manifest_get", "ok": False, "error": "ancien drive_client.py chargé"})
    results.append(probe("post_ping", lambda: client.call("ping")))
    print(json.dumps({"projectOSBackupDiagnostic": 1, "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
