"""One-time local configuration for the Google Drive relay."""
from __future__ import annotations
import getpass
import json
import os
from projectos_backup.drive_client import AppsScriptClient, preflight_drive
from projectos_backup.state import ConfigStore

def main():
    store = ConfigStore()
    url = input("URL Apps Script terminée par /exec : ").strip()
    token = getpass.getpass("Jeton secret (24 caractères minimum) : ").strip()
    client = AppsScriptClient(url, token)
    preflight_drive(client)
    store.directory.mkdir(parents=True, exist_ok=True)
    path = store.directory / "drive.json"
    temporary = path.with_suffix(".json.part")
    temporary.write_text(json.dumps({"url": client.url, "token": token}, indent=2), encoding="utf-8")
    os.replace(temporary, path)
    try: os.chmod(path, 0o600)
    except OSError: pass
    print("Google Drive configuré et testé.")

if __name__ == "__main__": main()
