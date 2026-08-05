"""In-memory Pillow charts with complete textual fallbacks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ChartAsset:
    kind: str
    image: Any | None
    fallback_text: str
    width: int
    height: int


def quota_gauge(
    percent: float | None,
    width: int = 420,
    height: int = 36,
    *,
    allow_pillow: bool = True,
) -> ChartAsset:
    if percent is None:
        return ChartAsset("gauge", None, "Quota : donnée indisponible", width, height)
    clamped = max(0.0, min(100.0, float(percent)))
    filled_blocks = max(0, min(10, round(clamped / 10)))
    fallback = "Quota [" + "█" * filled_blocks + "░" * (10 - filled_blocks) + f"] {clamped:.0f} %"
    if not allow_pillow:
        return ChartAsset("gauge", None, fallback, width, height)
    try:
        from PIL import Image, ImageDraw

        image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=height // 2, fill=(218, 224, 230, 255))
        fill_width = int((width - 1) * clamped / 100)
        color = (66, 121, 101, 255) if clamped >= 40 else (170, 116, 43, 255) if clamped >= 20 else (169, 68, 66, 255)
        if fill_width > 0:
            draw.rounded_rectangle((0, 0, fill_width, height - 1), radius=height // 2, fill=color)
        return ChartAsset("gauge", image, fallback, width, height)
    except Exception:
        return ChartAsset("gauge", None, fallback, width, height)


def history_chart(
    points: tuple[float, ...],
    width: int = 420,
    height: int = 120,
    *,
    allow_pillow: bool = True,
) -> ChartAsset:
    fallback = "Historique indisponible" if len(points) < 2 else "Historique : " + " → ".join(f"{point:.0f} %" for point in points)
    if len(points) < 2 or not allow_pillow:
        return ChartAsset("history", None, fallback, width, height)
    try:
        from PIL import Image, ImageDraw

        image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        coordinates: list[tuple[int, int]] = []
        for index, point in enumerate(points):
            x = int(index * (width - 12) / (len(points) - 1)) + 6
            y = height - 6 - int(max(0.0, min(100.0, point)) * (height - 12) / 100)
            coordinates.append((x, y))
        draw.line(coordinates, fill=(70, 104, 143, 255), width=4)
        for x, y in coordinates:
            draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(70, 104, 143, 255))
        return ChartAsset("history", image, fallback, width, height)
    except Exception:
        return ChartAsset("history", None, fallback, width, height)
