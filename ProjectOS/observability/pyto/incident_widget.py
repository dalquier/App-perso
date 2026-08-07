#!/usr/bin/env python3
"""ProjectOS incident counter widget for Pyto/iPhone.

The widget is read-only. It delegates parsing and aggregation to the canonical
ProjectOS incident_aggregator module and never writes to GitHub.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from importlib import util
from pathlib import Path
from typing import Any

LEDGER_URL = "https://github.com/dalquier/App-perso/issues/87"
RELOAD_MINUTES = 30
SCRIPT_DIR = Path(__file__).resolve().parent


def _load_aggregator():
    candidates = (
        SCRIPT_DIR / "incident_aggregator.py",
        SCRIPT_DIR.parent.parent / "scripts" / "incident_aggregator.py",
    )
    for path in candidates:
        if not path.exists():
            continue
        spec = util.spec_from_file_location("projectos_incident_aggregator", path)
        if spec is None or spec.loader is None:
            continue
        module = util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    raise RuntimeError(
        "incident_aggregator.py introuvable. Conserver le dépôt ProjectOS complet "
        "ou copier incident_aggregator.py à côté du widget."
    )


def read_summary() -> dict[str, Any]:
    aggregator = _load_aggregator()
    comments = aggregator.fetch_issue_comments()
    return aggregator.aggregate(aggregator.parse_comment_objects(comments))


def build_rows(summary: dict[str, Any], size: str = "medium") -> tuple[str, ...]:
    if size not in {"small", "medium", "large"}:
        raise ValueError("size must be small, medium or large")
    totals = summary.get("totals", {})
    severity = summary.get("by_severity", {})
    coverage = summary.get("by_projectos_coverage", {})
    by_type = summary.get("by_type", {})
    top_type = next(iter(by_type), "—")
    active = int(totals.get("active_incidents", 0))
    unique = int(totals.get("unique_incidents", 0))
    occurrences = int(totals.get("occurrences", 0))
    recent = int(totals.get("occurrences_last_7d", 0))
    recurrent = int(totals.get("recurrent_incidents", 0))
    severity_line = (
        f"S1 {severity.get('S1', 0)} · S2 {severity.get('S2', 0)} · "
        f"S3 {severity.get('S3', 0)} · S4 {severity.get('S4', 0)}"
    )
    if size == "small":
        return (f"{active} actifs", severity_line, f"7 j : +{recent}", f"Top : {top_type}")
    if size == "medium":
        return (
            f"{active} actifs · {unique} incidents",
            severity_line,
            f"{occurrences} occurrences · +{recent} sur 7 j",
            f"Récurrents {recurrent} · Top {top_type}",
        )
    return (
        f"{active} actifs · {unique} incidents uniques",
        severity_line,
        f"{occurrences} occurrences · +{recent} sur 7 j",
        f"Récurrents : {recurrent}",
        f"Type principal : {top_type}",
        f"Couverture : FULL {coverage.get('FULL', 0)} · PARTIAL {coverage.get('PARTIAL', 0)} · NONE {coverage.get('NONE', 0)}",
        f"Actualisé : {summary.get('generated_at', '—')}",
    )


def state_for(summary: dict[str, Any]) -> str:
    severity = summary.get("by_severity", {})
    if int(severity.get("S1", 0)):
        return "critical"
    if int(severity.get("S2", 0)):
        return "major"
    if int(summary.get("totals", {}).get("active_incidents", 0)):
        return "active"
    return "clear"


def next_reload_after(now: datetime | None = None) -> datetime:
    return (now or datetime.now(timezone.utc)) + timedelta(minutes=RELOAD_MINUTES)


def _color(widgets: Any, state: str) -> Any:
    values = {
        "critical": (0.72, 0.18, 0.16),
        "major": (0.82, 0.48, 0.08),
        "active": (0.18, 0.37, 0.78),
        "clear": (0.10, 0.48, 0.35),
    }
    return widgets.Color.rgb(*values.get(state, values["active"]))


def _font(widgets: Any, size: float, bold: bool = False) -> Any:
    factory = widgets.Font.bold_system_font_of_size if bold else widgets.Font.system_font_of_size
    return factory(size)


def _add_text(widgets: Any, layout: Any, text: str, size: float, *, bold: bool = False, color: Any = None) -> None:
    kwargs = {"font": _font(widgets, size, bold)}
    if color is not None:
        kwargs["color"] = color
    layout.add_row([widgets.Text(text, **kwargs)])


def _render_layout(widgets: Any, layout: Any, summary: dict[str, Any], size: str) -> None:
    accent = _color(widgets, state_for(summary))
    set_link = getattr(layout, "set_link", None)
    if callable(set_link):
        set_link(LEDGER_URL)
    _add_text(widgets, layout, "ProjectOS · Incidents", 11 if size != "large" else 13, bold=True)
    rows = build_rows(summary, size)
    for index, row in enumerate(rows):
        _add_text(
            widgets,
            layout,
            row,
            {"small": 11, "medium": 13, "large": 14}[size] if index else {"small": 22, "medium": 28, "large": 32}[size],
            bold=index <= 1,
            color=accent if index == 0 else None,
        )
    if hasattr(layout, "add_vertical_spacer"):
        layout.add_vertical_spacer()


def show_pyto_widget(*, widgets_module: Any | None = None) -> Any:
    if widgets_module is None:
        import widgets as widgets_module  # type: ignore[import-not-found]
    summary = read_summary()
    widget = widgets_module.Widget()
    _render_layout(widgets_module, widget.small_layout, summary, "small")
    _render_layout(widgets_module, widget.medium_layout, summary, "medium")
    _render_layout(widgets_module, widget.large_layout, summary, "large")
    scheduler = getattr(widgets_module, "schedule_next_reload", None)
    if callable(scheduler):
        try:
            scheduler(timedelta(minutes=RELOAD_MINUTES))
        except (TypeError, ValueError):
            try:
                scheduler(next_reload_after())
            except Exception:
                pass
    widgets_module.show_widget(widget)
    return widget


def main() -> None:
    try:
        import widgets as widgets_module  # type: ignore[import-not-found]
    except ImportError:
        summary = read_summary()
        print("ProjectOS · Incidents")
        for row in build_rows(summary, "medium"):
            print(row)
        return
    show_pyto_widget(widgets_module=widgets_module)


if __name__ == "__main__":
    main()
