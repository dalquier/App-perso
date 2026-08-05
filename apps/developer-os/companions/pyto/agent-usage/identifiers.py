"""Stable local identifiers for Agent Usage records."""

from __future__ import annotations

from datetime import date, datetime
import re

PREFIXES = {"task": "TSK", "snapshot": "SNP", "interval": "INT"}
_PATTERN = re.compile(r"^(TSK|SNP|INT)-(\d{8})-(\d{3})$")


def format_identifier(prefix: str, day: date, sequence: int) -> str:
    if prefix not in PREFIXES.values():
        raise ValueError("unknown identifier prefix")
    if sequence < 1 or sequence > 999:
        raise ValueError("sequence must be between 1 and 999")
    return f"{prefix}-{day:%Y%m%d}-{sequence:03d}"


def next_identifier(kind: str, existing_ids: list[str], when: datetime | None = None) -> str:
    prefix = PREFIXES[kind]
    day = (when or datetime.now()).date()
    day_text = f"{day:%Y%m%d}"
    sequences = [int(m.group(3)) for value in existing_ids if (m := _PATTERN.match(value)) and m.group(1) == prefix and m.group(2) == day_text]
    return format_identifier(prefix, day, (max(sequences) + 1) if sequences else 1)


def validate_identifier(value: str, kind: str | None = None) -> bool:
    match = _PATTERN.match(value or "")
    if not match:
        return False
    if kind is not None and match.group(1) != PREFIXES[kind]:
        return False
    return True
