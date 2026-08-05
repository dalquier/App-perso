"""Small CLI entry point for local checks in Pyto."""

from __future__ import annotations

from analytics import freshness, forecast_exhaustion, usage_statistics
from storage import JsonlStore


def main() -> None:
    store = JsonlStore()
    snapshots = store.snapshots()
    intervals = store.intervals()
    latest = max(snapshots, key=lambda item: item.captured_at, default=None)
    print("DeveloperOS Agent Usage")
    print(f"data_dir={store.root}")
    print(f"tasks={len(store.tasks())} snapshots={len(snapshots)} intervals={len(intervals)}")
    if latest:
        print(f"remaining={latest.remaining_percent}% freshness={freshness(latest.captured_at)}")
    print(f"stats={usage_statistics(intervals)}")
    print(f"forecast={forecast_exhaustion(snapshots, intervals)}")


if __name__ == "__main__":
    main()
