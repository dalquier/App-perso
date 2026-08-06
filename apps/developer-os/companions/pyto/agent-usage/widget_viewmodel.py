"""Ephemeral display model for the Pyto Agent Usage widget."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from math import ceil

from analytics import forecast_exhaustion, freshness
from models import TaskRecord, UsageInterval, UsageSnapshot, parse_datetime
from widget_reader import WidgetReadResult


@dataclass(frozen=True)
class WidgetViewModel:
    state: str
    percent_text: str
    percent_value: float | None
    status_text: str
    reset_text: str
    freshness_text: str
    credits_text: str
    activity_text: str
    usage_text: str
    last_task_text: str
    last_task_detail: str
    forecast_text: str
    history_points: tuple[float, ...]
    history_summary: str
    storage_text: str
    source_text: str
    quality_text: str
    link: str = "open:summary"


def _latest_tasks(tasks: list[TaskRecord]) -> list[TaskRecord]:
    """Return one latest lifecycle record per task_id."""
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


def _history(
    snapshots: list[UsageSnapshot], latest: UsageSnapshot
) -> tuple[tuple[float, ...], str]:
    compatible = sorted(
        (
            item
            for item in _eligible_snapshots(snapshots)
            if item.quota_scope == latest.quota_scope
            and item.quota_cycle_id == latest.quota_cycle_id
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


def _week_start(now: datetime) -> datetime:
    local = now.astimezone()
    return (local - timedelta(days=local.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def _source_label(source: str) -> str:
    return {
        "shortcut": "Raccourci",
        "manual": "Manuel",
        "projectos": "ProjectOS",
        "import": "Import",
    }.get(source, "Journal local")


def _credits_label(value: float | None) -> str:
    if value is None:
        return "Crédits : inconnus"
    if value == 0:
        return "Crédits : 0"
    return f"+{value:g} crédits"


def _freshness_label(captured_at: datetime, now: datetime) -> str:
    seconds = max(0, int((now - captured_at).total_seconds()))
    if seconds < 60:
        return "Mis à jour à l’instant"
    if seconds < 3600:
        return f"Mis à jour il y a {max(1, seconds // 60)} min"
    if seconds < 86400:
        return f"Mis à jour il y a {max(1, seconds // 3600)} h"
    return f"Dernier relevé il y a {max(1, seconds // 86400)} j"


def _reset_label(reset_at: datetime, now: datetime) -> str:
    seconds = int((reset_at - now).total_seconds())
    if seconds < -60:
        return "Reset passé"
    if seconds <= 3600:
        return f"Reset dans {max(1, ceil(max(0, seconds) / 60))} min"
    if seconds < 86400:
        return f"Reset dans {ceil(seconds / 3600)} h"
    if seconds < 7 * 86400:
        return f"Reset dans {max(1, seconds // 86400)} j"
    return "Reset le " + reset_at.astimezone().strftime("%d/%m · %H:%M")


def _task_timestamp(task: TaskRecord) -> datetime:
    value = task.ended_at or task.started_at
    return parse_datetime(value, "task_timestamp")


def _task_status_label(status: str) -> str:
    return {
        "planned": "Planifiée",
        "running": "En cours",
        "completed": "Terminée",
        "failed": "Échouée",
        "cancelled": "Annulée",
    }.get(status, status.capitalize())


def _task_tool_label(tool: str) -> str:
    return "Codex" if tool == "codex" else "Work" if tool == "work" else tool.capitalize()


def _truncate(value: str, limit: int) -> str:
    clean = " ".join(value.split())
    if len(clean) <= limit:
        return clean
    return clean[: max(1, limit - 1)].rstrip() + "…"


def _task_time_label(moment: datetime, now: datetime) -> str:
    local_moment = moment.astimezone()
    local_now = now.astimezone()
    if local_moment.date() == local_now.date():
        return "aujourd’hui · " + local_moment.strftime("%H:%M")
    if local_moment.date() == (local_now - timedelta(days=1)).date():
        return "hier · " + local_moment.strftime("%H:%M")
    return local_moment.strftime("%d/%m · %H:%M")


def _latest_task_labels(tasks: list[TaskRecord], now: datetime) -> tuple[str, str]:
    if not tasks:
        return "Dernière commande : aucune", "Aucune tâche enregistrée"
    latest = max(tasks, key=_task_timestamp)
    moment = _task_timestamp(latest)
    headline = "Dernière commande : " + _task_time_label(moment, now)
    detail = " · ".join(
        (
            _task_tool_label(latest.tool),
            _truncate(latest.title, 34),
            _task_status_label(latest.status),
        )
    )
    return headline, detail


def _weekly_activity(tasks: list[TaskRecord], now: datetime) -> str:
    start = _week_start(now)
    weekly = [
        task
        for task in tasks
        if start
        <= parse_datetime(task.started_at, "started_at").astimezone(start.tzinfo)
        <= now.astimezone(start.tzinfo)
    ]
    if not weekly:
        return "Aucune tâche cette semaine"
    codex = sum(task.tool == "codex" for task in weekly)
    work = sum(task.tool == "work" for task in weekly)
    return f"{codex} Codex · {work} Work"


def _weekly_usage(
    intervals: list[UsageInterval], latest: UsageSnapshot, now: datetime
) -> str:
    start = _week_start(now)
    valid = [
        interval
        for interval in intervals
        if interval.quota_scope == latest.quota_scope
        and interval.quota_cycle_id == latest.quota_cycle_id
        and interval.delta_percent is not None
        and interval.delta_percent >= 0
        and interval.attribution_mode
        not in {"reset_or_correction", "not_comparable"}
        and start
        <= parse_datetime(interval.ended_at, "ended_at").astimezone(start.tzinfo)
        <= now.astimezone(start.tzinfo)
    ]
    if not valid:
        return "Consommation inconnue"
    total = sum(float(interval.delta_percent or 0) for interval in valid)
    return f"−{total:g} pts observés"


def _empty_model(
    read: WidgetReadResult,
    message: str,
    *,
    activity_text: str,
    last_task_text: str,
    last_task_detail: str,
) -> WidgetViewModel:
    storage = read.public_message or message
    return WidgetViewModel(
        state=read.storage_state if read.storage_state != "primary" else "unknown",
        percent_text="—",
        percent_value=None,
        status_text=message,
        reset_text="Reset inconnu",
        freshness_text="Aucun relevé de quota",
        credits_text="Crédits : inconnus",
        activity_text=activity_text,
        usage_text="Consommation inconnue",
        last_task_text=last_task_text,
        last_task_detail=last_task_detail,
        forecast_text="Prévision indisponible",
        history_points=(),
        history_summary="Historique indisponible",
        storage_text=storage,
        source_text="Source : journaux locaux",
        quality_text="Qualité : inconnue",
        link="open:diagnostic",
    )


def build_view_model(
    read: WidgetReadResult, now: datetime | None = None
) -> WidgetViewModel:
    now = now or datetime.now(timezone.utc)
    tasks = _latest_tasks(read.tasks)
    activity_text = _weekly_activity(tasks, now)
    last_task_text, last_task_detail = _latest_task_labels(tasks, now)

    eligible = sorted(
        _eligible_snapshots(read.snapshots),
        key=lambda item: parse_datetime(item.captured_at, "captured_at"),
    )
    if not eligible:
        message = read.public_message or (
            "Aucun relevé" if not read.snapshots else "Donnée indisponible"
        )
        return _empty_model(
            read,
            message,
            activity_text=activity_text,
            last_task_text=last_task_text,
            last_task_detail=last_task_detail,
        )

    latest = eligible[-1]
    value = float(latest.remaining_percent)
    level = _level(value)
    freshness_state = freshness(latest.captured_at, now)
    captured = parse_datetime(latest.captured_at, "captured_at")
    reset_at = parse_datetime(latest.reset_at, "reset_at")
    base_status = {
        "comfortable": "Confortable",
        "warning": "Vigilance",
        "critical": "Niveau critique",
        "exhausted": "Quota épuisé",
        "unknown": "Donnée indisponible",
    }[level]
    state = "stale" if freshness_state == "stale" else level
    status = (
        f"Donnée ancienne · {base_status}"
        if freshness_state == "stale"
        else base_status
    )

    forecast_text = "Prévision indisponible"
    forecast = forecast_exhaustion(eligible, read.intervals)
    if (
        freshness_state == "fresh"
        and forecast.confidence == "estimated"
        and forecast.exhausts_at
    ):
        exhausts = parse_datetime(forecast.exhausts_at, "exhausts_at")
        if exhausts < reset_at:
            label = "Prévision prudente" if forecast.interval_count == 2 else "Prévision"
            forecast_text = (
                f"{label} : {exhausts.astimezone().strftime('%d/%m · %H:%M')}"
            )

    points, history_summary = _history(eligible, latest)
    storage_text = read.public_message or "Stockage principal"
    link = (
        "open:diagnostic"
        if read.storage_state in {"backup", "corrupt", "inaccessible"}
        else "open:summary"
    )
    return WidgetViewModel(
        state=state,
        percent_text=f"{value:.0f} % restant",
        percent_value=value,
        status_text=status,
        reset_text=_reset_label(reset_at, now),
        freshness_text=_freshness_label(captured, now),
        credits_text=_credits_label(latest.purchased_credits_remaining),
        activity_text=activity_text,
        usage_text=_weekly_usage(read.intervals, latest, now),
        last_task_text=last_task_text,
        last_task_detail=last_task_detail,
        forecast_text=forecast_text,
        history_points=points,
        history_summary=history_summary,
        storage_text=storage_text,
        source_text=f"Source : {_source_label(latest.source)}",
        quality_text="Données observées et validées",
        link=link,
    )
