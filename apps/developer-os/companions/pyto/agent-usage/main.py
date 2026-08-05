"""CLI entry point for local Agent Usage operations."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from analytics import freshness, forecast_exhaustion, usage_statistics, weekly_summary
from identifiers import next_identifier
from models import UsageSnapshot, parse_datetime
from storage import JsonlStore
from task_logger import TaskLogger


def emit(payload: dict, code: int = 0) -> int:
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2))
    return code


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser()
    p.add_argument("--data-dir")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init")
    sub.add_parser("doctor")
    ct = sub.add_parser("create-task"); ct.add_argument("--tool", required=True); ct.add_argument("--project", required=True); ct.add_argument("--title", required=True); ct.add_argument("--started-at")
    st = sub.add_parser("start-task"); st.add_argument("--task-id"); st.add_argument("--tool"); st.add_argument("--project"); st.add_argument("--title"); st.add_argument("--started-at")
    cl = sub.add_parser("close-task"); cl.add_argument("task_id"); cl.add_argument("--status", default="completed"); cl.add_argument("--ended-at")
    sn = sub.add_parser("add-snapshot"); sn.add_argument("--remaining-percent", type=float, required=True); sn.add_argument("--captured-at", required=True); sn.add_argument("--reset-at", required=True); sn.add_argument("--scope", required=True); sn.add_argument("--cycle-id", required=True); sn.add_argument("--validated-at", required=True); sn.add_argument("--source", default="manual"); sn.add_argument("--human-validated", action="store_true"); sn.add_argument("--purchased-credits", type=float); sn.add_argument("--quota-event", default="unknown")
    ws = sub.add_parser("weekly-summary"); ws.add_argument("--week-start", required=True); ws.add_argument("--tool"); ws.add_argument("--project")
    sub.add_parser("integrity-check")
    ex = sub.add_parser("export"); ex.add_argument("path")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    store = JsonlStore(Path(args.data_dir) if args.data_dir else None)
    logger = TaskLogger(store)
    try:
        if args.cmd == "init":
            store.ensure(); return emit({"ok": True, "data_dir": str(store.root)})
        if args.cmd == "doctor":
            snapshots = store.snapshots(); intervals = store.intervals(); latest = max(snapshots, key=lambda item: item.captured_at, default=None)
            return emit({"ok": True, "data_dir": str(store.root), "tasks": len(store.tasks()), "snapshots": len(snapshots), "intervals": len(intervals), "latest_freshness": freshness(latest.captured_at) if latest else None, "stats": usage_statistics(intervals), "forecast": forecast_exhaustion(snapshots, intervals).to_dict()})
        if args.cmd == "create-task":
            return emit({"ok": True, "task": logger.create_task(args.tool, args.project, args.title, started_at=args.started_at).to_dict()})
        if args.cmd == "start-task":
            return emit({"ok": True, "task": logger.start_task(args.tool, args.project, args.title, started_at=args.started_at, task_id=args.task_id).to_dict()})
        if args.cmd == "close-task":
            return emit({"ok": True, "task": logger.close_task(args.task_id, args.status, args.ended_at).to_dict()})
        if args.cmd == "add-snapshot":
            captured = parse_datetime(args.captured_at, "captured_at")
            snap = UsageSnapshot.create(snapshot_id=next_identifier("snapshot", [s.snapshot_id for s in store.snapshots()], captured), captured_at=args.captured_at, remaining_percent=args.remaining_percent, reset_at=args.reset_at, measurement_scope=args.scope, quota_scope=args.scope, quota_cycle_id=args.cycle_id, purchased_credits_remaining=args.purchased_credits, source=args.source, validated_at=args.validated_at, human_validated=args.human_validated, quota_event=args.quota_event)
            store.add_snapshot(snap); return emit({"ok": True, "snapshot": snap.to_dict()})
        if args.cmd == "weekly-summary":
            return emit({"ok": True, "summary": weekly_summary(store.tasks(), store.intervals(), store.snapshots(), args.week_start, args.tool, args.project).to_dict()})
        if args.cmd == "integrity-check":
            report = store.integrity_check(); return emit({"ok": report.ok, "duplicate_ids": report.duplicate_ids, "skipped": {k: [s.__dict__ for s in v.skipped] for k, v in report.collections.items()}}, 0 if report.ok else 2)
        if args.cmd == "export":
            store.export_valid(Path(args.path)); return emit({"ok": True, "path": args.path})
    except Exception as exc:
        return emit({"ok": False, "error": str(exc)}, 2)
    return 1


if __name__ == "__main__":
    sys.exit(main())
