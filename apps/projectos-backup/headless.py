"""Headless entry point intended for the iOS Shortcuts 'Run Script' action."""

from __future__ import annotations

import json

from projectos_backup.core import FilterRules, Source, run_backup
from projectos_backup.pyto_access import BackgroundExecution, request_icloud_download, resolve_folder
from projectos_backup.state import ConfigStore


def main() -> int:
    store = ConfigStore()
    config = store.load()
    destination_name = config.get("destinationBookmark")
    if not destination_name:
        print(json.dumps({"status": "error", "error": "destination_not_configured"}))
        return 2
    sources = [
        Source(item.source_id, item.label, resolve_folder(item.bookmark_name))
        for item in store.sources()
        if item.enabled
    ]
    background = BackgroundExecution()
    background.begin()
    try:
        result = run_backup(
            sources,
            resolve_folder(destination_name),
            prepare_file=request_icloud_download,
            should_cancel=background.expired.is_set,
            filters=FilterRules.from_config(config.get("filters")),
        )
    except Exception as exc:
        print(json.dumps({"status": "error", "error": str(exc)}, ensure_ascii=False))
        return 1
    finally:
        background.end()
    print(json.dumps(result.to_dict(), ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
