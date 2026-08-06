"""Platform-neutral Calm Instrument rendering specification."""

from __future__ import annotations

from dataclasses import dataclass

from widget_render_charts import ChartAsset, history_chart, quota_gauge
from widget_viewmodel import WidgetViewModel

SAFE_LINKS = {"open:summary", "open:tasks", "open:import", "open:diagnostic"}


@dataclass(frozen=True)
class WidgetTheme:
    light_background: str = "#F4F6F8"
    dark_background: str = "#0C0F14"
    light_primary: str = "#15181D"
    dark_primary: str = "#F5F7FA"
    light_secondary: str = "#5F6875"
    dark_secondary: str = "#AAB2BF"
    light_accent: str = "#315FCC"
    dark_accent: str = "#82A7FF"


@dataclass(frozen=True)
class RenderedWidget:
    size: str
    title: str
    rows: tuple[str, ...]
    link: str
    charts: tuple[ChartAsset, ...]
    theme: WidgetTheme


def _theme_for_state(state: str) -> WidgetTheme:
    accent = {
        "comfortable": ("#14765D", "#55D6AE"),
        "warning": ("#8A5700", "#F5BC62"),
        "critical": ("#A12B27", "#FF8C86"),
        "exhausted": ("#701F25", "#FFAAA5"),
        "stale": ("#775421", "#E6B96B"),
        "unknown": ("#626A75", "#9BA4B1"),
        "empty": ("#626A75", "#9BA4B1"),
        "backup": ("#775421", "#E6B96B"),
        "corrupt": ("#A12B27", "#FF8C86"),
        "inaccessible": ("#A12B27", "#FF8C86"),
    }.get(state, ("#315FCC", "#82A7FF"))
    return WidgetTheme(light_accent=accent[0], dark_accent=accent[1])


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
    storage_warning = () if vm.storage_text == "Stockage principal" else (vm.storage_text,)

    if size == "small":
        rows = (
            vm.percent_text,
            vm.status_text,
            vm.reset_text,
            vm.credits_text,
            vm.freshness_text,
        ) + storage_warning
    elif size == "medium":
        rows = (
            vm.percent_text,
            f"{vm.status_text} · {vm.reset_text}",
            vm.credits_text,
            vm.last_task_text,
            vm.last_task_detail,
            vm.freshness_text,
        ) + storage_warning
    else:
        history = history_chart(vm.history_points, allow_pillow=allow_pillow)
        charts.append(history)
        rows = (
            vm.percent_text,
            f"{vm.status_text} · {vm.reset_text}",
            vm.credits_text,
            vm.activity_text,
            vm.usage_text,
            vm.last_task_text,
            vm.last_task_detail,
            vm.forecast_text,
            vm.history_summary,
            vm.freshness_text,
            vm.quality_text,
        ) + storage_warning
        if history.image is None:
            rows += (history.fallback_text,)

    safe_link = vm.link if vm.link in SAFE_LINKS else "open:diagnostic"
    return RenderedWidget(
        size=size,
        title="Agent Usage",
        rows=tuple(rows),
        link=safe_link,
        charts=tuple(charts[:2]),
        theme=_theme_for_state(vm.state),
    )
