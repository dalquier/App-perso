"""Ephemeral display model for the Pyto Agent Usage widget."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from analytics import forecast_exhaustion, freshness, weekly_summary
from models import TaskRecord, UsageSnapshot, parse_datetime
from widget_reader import WidgetReadResult


@dataclass(frozen=True)
class WidgetViewModel:
    state: str
    percent_text: str
    percent_value: float | None
    status_text: str
    reset_text: str
    freshness_text: str
    credits_text: str | None
    activity_text: str
    forecast_text: str
    history_points: tuple[float, ...]
    history_summary: str
    weekly_text: str
    tasks_text: str
    intervals_text: str
    storage_text: str
    source_text: str
    quality_text: str
    link: str = "open:summary"


def _latest_tasks(tasks: list[TaskRecord]) -> list[TaskRecord]:
    latest: dict[str, TaskRecord] = {}
    order: list[str] = []
    for task in tasks:
        if task.task_id not in latest:
            order.append(task.task_id)
        latest[task.task_id] = task
    return [latest[task_id] for task_id in order]


def _level(value: float | None) -> str:
    if value is None:
        return "unknown"
    if value == 0:
        return "exhausted"
    if value < 20:
        return "critical"
    if value < 40:
        return "warning"
    return "comfortable"


def _eligible_snapshots(snapshots: list[UsageSnapshot]) -> list[UsageSnapshot]:
    return [item for item in snapshots if item.human_validated and item.confidence == "observed"]


def _history(snapshots: list[UsageSnapshot], latest: UsageSnapshot) -> tuple[tuple[float, ...], str]:
    compatible = sorted(
        (
            item
            for item in _eligible_snapshots(snapshots)
            if item.quota_scope == latest.quota_scope and item.quota_cycle_id == latest.quota_cycle_id
        ),
        key=lambda item: parse_datetime(item.captured_at, "captured_at"),
    )
    segment: list[UsageSnapshot] = []
    for item in compatible:
        if item.quota_event in {"reset", "correction", "recharge"}:
            segment = []
            continue
        if segment and item.remaining_percent > segment[-1].remaining_percent:
            segment = [item]
        else:
            segment.append(item)
    selected = segment[-7:]
    points = tuple(float(item.remaining_percent) for item in selected)
    if len(points) < 2:
        return (), "Historique indisponible"
    variation = points[-1] - points[0]
    return points, f"{len(points)} relevés · variation {variation:+.0f} pts"


def _week_start(now: datetime) -> str:
    local = now.astimezone()
    monday = (local - timedelta(days=local.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return monday.isoformat()


def _source_label(source: str) -> str:
    return {
        "shortcut": "Raccourci",
        "manual": "Manuel",
        "projectos": "ProjectOS",
        "import": "Import",
    }.get(source, "Journal local")


def _empty_model(read: WidgetReadResult, message: str) -> WidgetViewModel:
    storage = read.public_message or message
    return WidgetViewModel(
        state=read.storage_state if read.storage_state != "primary" else "unknown",
        percent_text="—",
        percent_value=None,
        status_text=message,
        reset_text="Reset —",
        freshness_text=message,
        credits_text=None,
        activity_text="Aucune activité",
        forecast_text="Prévision indisponible",
        history_points=(),
        history_summary="Historique indisponible",
        weekly_text="Semaine indisponible",
        tasks_text="Tâches indisponibles",
        intervals_text="Intervalles indisponibles",
        storage_text=storage,
        source_text="Source : journaux locaux",
        quality_text="Qualité : inconnue",
        link="open:diagnostic",
    )


def build_view_model(read: WidgetReadResult, now: datetime | None = None) -> WidgetViewModel:
    now = now or datetime.now(timezone.utc)
    eligible = sorted(
        _eligible_snapshots(read.snapshots),
        key=lambda item: parse_datetime(item.captured_at, "captured_at"),
    )
    if not eligible:
        message = read.public_message or ("Aucun relevé" if not read.snapshots else "Donnée indisponible")
        return _empty_model(read, message)

    latest = eligible[-1]
    value = float(latest.remaining_percent)
    level = _level(value)
    freshness_state = freshness(latest.captured_at, now)
    captured = parse_datetime(latest.captured_at, "captured_at")
    base_status = {
        "comfortable": "Confortable",
        "warning": "Vigilance",
        "critical": "Critique",
        "exhausted": "Épuisé",
        "unknown": "Donnée indisponible",
    }[level]
    state = "stale" if freshness_state == "stale" else level
    status = f"Donnée ancienne · {base_status}" if freshness_state == "stale" else base_status
    freshness_text = ("Donnée ancienne" if freshness_state == "stale" else "Relevé") + " " + captured.astimezone().strftime("%d/%m · %H:%M")

    credits = latest.purchased_credits_remaining
    credits_text = None if credits is None else ("Crédits : 0" if credits == 0 else f"Crédits : {credits:g}")

    forecast_text = "Prévision indisponible"
    forecast = forecast_exhaustion(eligible, read.intervals)
    if freshness_state == "fresh" and forecast.confidence == "estimated" and forecast.exhausts_at:
        exhausts = parse_datetime(forecast.exhausts_at, "exhausts_at")
        reset = parse_datetime(latest.reset_at, "reset_at")
        if exhausts < reset:
            label = "Prévision prudente" if forecast.interval_count == 2 else "Prévision"
            forecast_text = f"{label} : {exhausts.astimezone().strftime('%d/%m · %H:%M')}"

    points, history_summary = _history(eligible, latest)
    tasks = _latest_tasks(read.tasks)
    recent_tasks = sorted(tasks, key=lambda item: parse_datetime(item.started_at, "started_at"), reverse=True)[:3]
    activity = f"{len(recent_tasks)} tâche(s) récente(s)" if recent_tasks else "Aucune activité récente"

    try:
        summary = weekly_summary(tasks, read.intervals, eligible, _week_start(now))
        weekly_text = f"Semaine : {summary.total_delta_percent:.0f} pts attribués"
    except Exception:
        weekly_text = "Semaine indisponible"

    attributable = [
        interval
        for interval in read.intervals
        if interval.quota_scope == latest.quota_scope
        and interval.quota_cycle_id == latest.quota_cycle_id
        and interval.attribution_mode == "single_task"
        and len(interval.task_ids) == 1
        and interval.delta_percent is not None
    ]
    storage_text = read.public_message or "Stockage principal"
    link = "open:diagnostic" if read.storage_state in {"backup", "corrupt", "inaccessible"} else "open:summary"
    return WidgetViewModel(
        state=state,
        percent_text=f"{value:.0f} %",
        percent_value=value,
        status_text=status,
        reset_text="Reset " + parse_datetime(latest.reset_at, "reset_at").astimezone().strftime("%d/%m · %H:%M"),
        freshness_text=freshness_text,
        credits_text=credits_text,
        activity_text=activity,
        forecast_text=forecast_text,
        history_points=points,
        history_summary=history_summary,
        weekly_text=weekly_text,
        tasks_text=f"{len(tasks)} tâche(s) logique(s)",
        intervals_text=f"{len(attributable)} intervalle(s) attribuable(s)",
        storage_text=storage_text,
        source_text=f"Source : {_source_label(latest.source)}",
        quality_text="Qualité : observée et validée",
        link=link,
    )
