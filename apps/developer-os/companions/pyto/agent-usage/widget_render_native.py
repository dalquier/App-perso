"""Platform-neutral Calm Instrument rendering specification."""

from __future__ import annotations

from dataclasses import dataclass

from widget_render_charts import ChartAsset, history_chart, quota_gauge
from widget_viewmodel import WidgetViewModel

SAFE_LINKS = {"open:summary", "open:tasks", "open:import", "open:diagnostic"}


@dataclass(frozen=True)
class WidgetTheme:
    light_background: str = "#F8F6F1"
    dark_background: str = "#101418"
    light_primary: str = "#101820"
    dark_primary: str = "#F1F4F6"
    light_secondary: str = "#59626B"
    dark_secondary: str = "#AEB7BF"


@dataclass(frozen=True)
class RenderedWidget:
    size: str
    title: str
    rows: tuple[str, ...]
    link: str
    charts: tuple[ChartAsset, ...]
    theme: WidgetTheme


def render_widget(
    vm: WidgetViewModel,
    size: str = "medium",
    *,
    allow_pillow: bool = True,
) -> RenderedWidget:
    if size not in {"small", "medium", "large"}:
        raise ValueError("size must be small, medium or large")

    gauge = quota_gauge(vm.percent_value, allow_pillow=allow_pillow)
    charts: list[ChartAsset] = [gauge]
    if size == "small":
        rows = (
            vm.percent_text,
            vm.status_text,
            gauge.fallback_text if gauge.image is None else "Quota",
            vm.reset_text,
            vm.freshness_text,
        )
        if vm.storage_text != "Stockage principal":
            rows += (vm.storage_text,)
    elif size == "medium":
        rows = (
            vm.percent_text,
            vm.status_text,
            gauge.fallback_text if gauge.image is None else "Quota",
            vm.reset_text,
            vm.freshness_text,
            vm.credits_text or "Crédits : non affichés",
            vm.activity_text,
            vm.forecast_text,
            vm.storage_text,
        )
    else:
        history = history_chart(vm.history_points, allow_pillow=allow_pillow)
        charts.append(history)
        rows = (
            vm.percent_text,
            vm.status_text,
            vm.reset_text,
            vm.credits_text or "Crédits : non affichés",
            vm.freshness_text,
            vm.weekly_text,
            vm.tasks_text,
            vm.intervals_text,
            vm.forecast_text,
            vm.history_summary,
            vm.storage_text,
            vm.source_text,
            vm.quality_text,
        )
        if history.image is None:
            rows += (history.fallback_text,)

    safe_link = vm.link if vm.link in SAFE_LINKS else "open:diagnostic"
    return RenderedWidget(
        size=size,
        title="Agent Usage",
        rows=tuple(rows),
        link=safe_link,
        charts=tuple(charts[:2]),
        theme=WidgetTheme(),
    )
