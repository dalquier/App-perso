"""Pyto Run Script entry point for the Agent Usage Calm Instrument widget."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from widget_reader import read_widget_data
from widget_render_native import RenderedWidget, render_widget
from widget_viewmodel import build_view_model

SAFE_LINKS = {"open:summary", "open:tasks", "open:import", "open:diagnostic"}
RELOAD_MINUTES = 45


def build(
    size: str = "medium",
    data_dir: str | None = None,
    *,
    allow_pillow: bool = True,
) -> RenderedWidget:
    read = read_widget_data(data_dir)
    view_model = build_view_model(read)
    return render_widget(view_model, size=size, allow_pillow=allow_pillow)


def build_all(
    data_dir: str | None = None, *, allow_pillow: bool = True
) -> dict[str, RenderedWidget]:
    read = read_widget_data(data_dir)
    view_model = build_view_model(read)
    return {
        size: render_widget(view_model, size=size, allow_pillow=allow_pillow)
        for size in ("small", "medium", "large")
    }


def next_reload_after(now: datetime | None = None) -> datetime:
    return (now or datetime.now(timezone.utc)) + timedelta(minutes=RELOAD_MINUTES)


def _rgb(widgets: Any, hex_color: str) -> Any:
    value = hex_color.lstrip("#")
    red, green, blue = (
        int(value[index : index + 2], 16) / 255 for index in (0, 2, 4)
    )
    return widgets.Color.rgb(red, green, blue)


def _dynamic_color(widgets: Any, light: str, dark: str) -> Any:
    return widgets.Color.dynamic(light=_rgb(widgets, light), dark=_rgb(widgets, dark))


def _font(widgets: Any, size: float, bold: bool = False) -> Any:
    factory = (
        widgets.Font.bold_system_font_of_size
        if bold
        else widgets.Font.system_font_of_size
    )
    return factory(size)


def _add_text(
    widgets: Any,
    layout: Any,
    text: str,
    color: Any,
    size: float,
    *,
    bold: bool = False,
) -> None:
    layout.add_row(
        [widgets.Text(text, color=color, font=_font(widgets, size, bold=bold))]
    )


def _row_style(size: str, index: int) -> tuple[float, bool, str]:
    if index == 0:
        return ({"small": 34, "medium": 40, "large": 46}[size], True, "accent")
    if index == 1:
        return ({"small": 12, "medium": 13, "large": 14}[size], True, "primary")
    if index == 2:
        return ({"small": 11, "medium": 13, "large": 15}[size], True, "primary")
    return ({"small": 10, "medium": 11, "large": 12}[size], False, "secondary")


def _apply_layout(widgets: Any, layout: Any, rendered: RenderedWidget) -> None:
    theme = rendered.theme
    background = _dynamic_color(
        widgets, theme.light_background, theme.dark_background
    )
    primary = _dynamic_color(widgets, theme.light_primary, theme.dark_primary)
    secondary = _dynamic_color(
        widgets, theme.light_secondary, theme.dark_secondary
    )
    accent = _dynamic_color(widgets, theme.light_accent, theme.dark_accent)
    colors = {"primary": primary, "secondary": secondary, "accent": accent}

    layout.set_background_color(background)
    set_link = getattr(layout, "set_link", None)
    if callable(set_link):
        set_link(rendered.link)

    _add_text(
        widgets,
        layout,
        rendered.title,
        secondary,
        {"small": 10, "medium": 11, "large": 12}[rendered.size],
        bold=True,
    )

    gauge = next((chart for chart in rendered.charts if chart.kind == "gauge"), None)
    history = next((chart for chart in rendered.charts if chart.kind == "history"), None)

    for index, row in enumerate(rendered.rows):
        font_size, bold, color_role = _row_style(rendered.size, index)
        _add_text(
            widgets,
            layout,
            row,
            colors[color_role],
            font_size,
            bold=bold,
        )
        if index == 0 and gauge is not None:
            if gauge.image is not None:
                layout.add_row([widgets.Image(image=gauge.image)])
            else:
                _add_text(
                    widgets,
                    layout,
                    gauge.fallback_text,
                    secondary,
                    9 if rendered.size == "small" else 10,
                )
        if (
            rendered.size == "large"
            and index == 7
            and history is not None
            and history.image is not None
        ):
            layout.add_row([widgets.Image(image=history.image)])

    if hasattr(layout, "add_vertical_spacer"):
        layout.add_vertical_spacer()


def _request_reload(widgets: Any) -> bool:
    scheduler = getattr(widgets, "schedule_next_reload", None)
    if not callable(scheduler):
        return False
    candidates = (
        timedelta(minutes=RELOAD_MINUTES),
        next_reload_after(),
        RELOAD_MINUTES * 60,
    )
    for candidate in candidates:
        try:
            scheduler(candidate)
            return True
        except (TypeError, ValueError):
            continue
        except Exception:
            return False
    return False


def show_pyto_widget(
    data_dir: str | None = None,
    *,
    widgets_module: Any | None = None,
) -> Any:
    if widgets_module is None:
        import widgets as widgets_module  # type: ignore[import-not-found]

    rendered = build_all(data_dir)
    widget = widgets_module.Widget()
    _apply_layout(widgets_module, widget.small_layout, rendered["small"])
    _apply_layout(widgets_module, widget.medium_layout, rendered["medium"])
    _apply_layout(widgets_module, widget.large_layout, rendered["large"])
    _request_reload(widgets_module)
    widgets_module.show_widget(widget)
    return widget


def safe_requested_link(value: object) -> str | None:
    return value if isinstance(value, str) and value in SAFE_LINKS else None


def main() -> None:
    try:
        import widgets as widgets_module  # type: ignore[import-not-found]
    except ImportError:
        rendered = build("medium", allow_pillow=False)
        print(rendered.title)
        for row in rendered.rows:
            print(row)
        print("reload_after", next_reload_after().isoformat())
        return

    requested = safe_requested_link(getattr(widgets_module, "link", None))
    if requested:
        print(requested)
    show_pyto_widget(widgets_module=widgets_module)


if __name__ == "__main__":
    main()
