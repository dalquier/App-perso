"""Shortcuts OCR/text parser for Agent Usage BUILD-02.

Raw OCR text is accepted transiently and is never persisted by this module.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re
import unicodedata
from zoneinfo import ZoneInfo

PURCHASED_CREDIT_STATUSES = {
    "explicit_value",
    "explicit_zero",
    "not_displayed",
    "unreadable",
    "not_purchased",
    "not_applicable",
}

_MONTHS = {
    "janvier": 1, "janv": 1, "jan": 1, "january": 1,
    "fevrier": 2, "février": 2, "fevr": 2, "févr": 2, "fév": 2, "february": 2, "feb": 2,
    "mars": 3, "march": 3, "mar": 3,
    "avril": 4, "avr": 4, "april": 4, "apr": 4,
    "mai": 5, "may": 5,
    "juin": 6, "june": 6, "jun": 6,
    "juillet": 7, "juil": 7, "july": 7, "jul": 7,
    "aout": 8, "août": 8, "august": 8, "aug": 8,
    "septembre": 9, "sept": 9, "september": 9, "sep": 9,
    "octobre": 10, "october": 10, "oct": 10,
    "novembre": 11, "november": 11, "nov": 11,
    "decembre": 12, "décembre": 12, "dec": 12, "déc": 12, "december": 12,
}


@dataclass(frozen=True)
class ParseResult:
    candidate: dict
    candidate_sets: dict


def normalize_for_hash(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).replace("\r\n", "\n").replace("\r", "\n")
    clean: list[str] = []
    for ch in text:
        category = unicodedata.category(ch)
        if ch in {"\n", "\t"} or not category.startswith("C"):
            clean.append(" " if ch in {"\u00a0", "\u202f"} else ch)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in "".join(clean).split("\n")]
    collapsed: list[str] = []
    previous_blank = False
    for line in lines:
        blank = not line
        if blank and previous_blank:
            continue
        collapsed.append(line)
        previous_blank = blank
    return "\n".join(collapsed).strip()


def _search_text(text: str) -> str:
    lowered = normalize_for_hash(text).lower().replace("’", "'").replace("–", "-").replace("—", "-")
    return "".join(char for char in unicodedata.normalize("NFD", lowered) if unicodedata.category(char) != "Mn")


def _confidence(items: list[dict]) -> str:
    if not items:
        return "absent"
    first = items[0]
    if first.get("ambiguous"):
        return "ambiguous"
    if len(items) > 1 and first.get("score", 0) - items[1].get("score", 0) < 3:
        return "ambiguous"
    return "certain" if first.get("score", 0) >= 10 else "probable"


def parse_percent(text: str, manual: bool = False) -> list[dict]:
    flat = _search_text(text)
    results: list[dict] = []
    pattern = r"(?<![\d.])(\d{1,3}|o)\s*%(?!\d)"
    for match in re.finditer(pattern, flat):
        raw = match.group(1)
        value = 0 if raw == "o" else int(raw)
        if value > 100:
            continue
        window = flat[max(0, match.start() - 60):match.end() + 60]
        score = 5
        if re.search(r"restant|restants|remaining|left|quota", window):
            score += 6
        if re.search(r"credit|credits", window):
            score -= 8
        results.append({
            "value": value,
            "score": score,
            "context": flat[max(0, match.start() - 24):match.end() + 24],
            "provenance": "percentage_near_quota_keyword",
            "ambiguous": raw == "o",
            "warning": "OCR_ZERO_FROM_LETTER_O" if raw == "o" else None,
        })
    if manual and not results:
        stripped = flat.strip()
        if re.fullmatch(r"\d{1,3}", stripped) and int(stripped) <= 100:
            results.append({
                "value": int(stripped),
                "score": 10,
                "context": stripped,
                "provenance": "manual_number_without_percent",
                "ambiguous": False,
                "warning": None,
            })
    return sorted(results, key=lambda item: item["score"], reverse=True)


def parse_credits(text: str) -> tuple[int | None, str, list[dict]]:
    flat = _search_text(text)
    found: list[dict] = []
    patterns = [
        r"(?:credits?|purchased credits|credits supplementaires)\s*(?:remaining|restants?|disponibles?|available|:)?\s*(\d+)(?!\s*%)",
        r"(\d+)(?!\s*%)\s+(?:credits?)\s+(?:available|disponibles?)",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, flat):
            found.append({"value": int(match.group(1)), "provenance": "credits_keyword", "score": 10})
    if found:
        value = found[0]["value"]
        return value, "explicit_zero" if value == 0 else "explicit_value", found
    if re.search(r"not purchased|non achet", flat):
        return None, "not_purchased", []
    if re.search(r"unreadable|illisible", flat):
        return None, "unreadable", []
    return None, "not_displayed", []


def _parse_time(chunk: str) -> tuple[int, int, bool] | None:
    match = re.search(r"(\d{1,2})\s*(?:[:;.h]|\s+h\s+)\s*(\d{2})\s*(am|pm)?", chunk, re.I)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2))
    ampm = (match.group(3) or "").lower()
    if ampm:
        if not 1 <= hour <= 12:
            return None
        if ampm == "pm" and hour != 12:
            hour += 12
        if ampm == "am" and hour == 12:
            hour = 0
    if hour > 23 or minute > 59:
        return None
    punctuation_normalized = match.group(0).find(";") >= 0 or match.group(0).find(".") >= 0
    return hour, minute, punctuation_normalized


def _valid_local_datetime(year: int, month: int, day: int, hour: int, minute: int, zone: ZoneInfo) -> tuple[datetime | None, str | None]:
    try:
        local = datetime(year, month, day, hour, minute, tzinfo=zone)
    except ValueError:
        return None, "INVALID_RESET_DATE"
    round_trip = local.astimezone(ZoneInfo("UTC")).astimezone(zone)
    if (round_trip.year, round_trip.month, round_trip.day, round_trip.hour, round_trip.minute) != (year, month, day, hour, minute):
        return None, "DST_NONEXISTENT_TIME"
    alternate = local.replace(fold=1)
    if local.utcoffset() != alternate.utcoffset():
        return None, "DST_AMBIGUOUS_TIME"
    return local, None


def parse_resets(text: str, captured_at: str, timezone: str = "Europe/Paris") -> list[dict]:
    flat = _search_text(text).replace("\n", " ")
    captured = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
    zone = ZoneInfo(timezone)
    results: list[dict] = []
    month_alt = "|".join(sorted(map(re.escape, _MONTHS), key=len, reverse=True))
    patterns = [
        (re.compile(rf"(?:\b|l)(\d{{1,2}})\s+({month_alt})(?:\s+(\d{{4}}))?", re.I), "day_first"),
        (re.compile(rf"({month_alt})\s+(\d{{1,2}})(?:\s*,?\s*(\d{{4}}))?", re.I), "month_first"),
    ]
    for date_pattern, order in patterns:
        for match in date_pattern.finditer(flat):
            if order == "day_first":
                day, month_name, year_text = int(match.group(1)), match.group(2), match.group(3)
            else:
                month_name, day, year_text = match.group(1), int(match.group(2)), match.group(3)
            month = _MONTHS[month_name.lower().rstrip(".")]
            parsed_time = _parse_time(flat[match.start():match.end() + 80])
            if parsed_time is None:
                results.append({
                    "value": None,
                    "score": 2,
                    "context": match.group(0),
                    "provenance": "date_without_time",
                    "ambiguous": True,
                    "warning": "NO_RESET_TIME",
                })
                continue
            years = [int(year_text)] if year_text else [captured.year, captured.year + 1]
            for year in years:
                local, temporal_error = _valid_local_datetime(year, month, day, parsed_time[0], parsed_time[1], zone)
                if temporal_error:
                    results.append({
                        "value": None,
                        "score": 1,
                        "context": match.group(0),
                        "provenance": "invalid_local_datetime",
                        "ambiguous": True,
                        "warning": temporal_error,
                    })
                    continue
                assert local is not None
                delta_seconds = (local - captured.astimezone(zone)).total_seconds()
                warning = None
                ambiguous = not bool(year_text)
                score = 12 if year_text else 9
                if delta_seconds < -900:
                    warning = "RESET_IN_PAST"
                    ambiguous = True
                    score -= 6
                elif delta_seconds > 45 * 86400:
                    warning = "RESET_TOO_FAR"
                    ambiguous = True
                    score -= 4
                elif delta_seconds > 14 * 86400:
                    warning = "RESET_REQUIRES_CONFIRMATION"
                    ambiguous = True
                    score -= 2
                elif parsed_time[2]:
                    warning = "RESET_PUNCTUATION_NORMALIZED"
                    score -= 1
                results.append({
                    "value": local.isoformat(),
                    "score": score,
                    "context": flat[max(0, match.start() - 20):match.end() + 40],
                    "provenance": "localized_month_date_time",
                    "ambiguous": ambiguous,
                    "warning": warning,
                })
    return sorted(results, key=lambda item: item["score"], reverse=True)[:4]


def quota_cycle_id(scope: str, reset_at: str) -> str:
    normalized_scope = re.sub(r"[^a-z0-9]+", "-", scope.lower()).strip("-")
    reset = datetime.fromisoformat(reset_at.replace("Z", "+00:00")).astimezone(ZoneInfo("UTC")).replace(second=0, microsecond=0)
    return f"{normalized_scope}__{reset:%Y%m%dT%H%M%SZ}"


def parse_usage_candidate(
    text: str,
    captured_at: str,
    measurement_scope: str,
    quota_scope: str,
    timezone: str,
    input_mode: str,
    raw_text_hash: str | None,
) -> ParseResult:
    percents = parse_percent(text, manual=input_mode == "manual")
    resets = parse_resets(text, captured_at, timezone)
    credits, credit_status, credit_items = parse_credits(text)
    warnings: list[dict] = []
    if measurement_scope != quota_scope:
        warnings.append({"code": "SCOPE_MISMATCH", "field": "quota_scope", "requires_confirmation": False})
    if not percents:
        warnings.append({"code": "NO_PERCENT_CANDIDATE", "field": "remaining_percent", "requires_confirmation": False})
    if not resets or resets[0].get("value") is None:
        warnings.append({"code": "NO_RESET", "field": "reset_at", "requires_confirmation": False})
    for field, items in (("remaining_percent", percents), ("reset_at", resets)):
        if items and items[0].get("warning"):
            warnings.append({
                "code": items[0]["warning"],
                "field": field,
                "requires_confirmation": items[0]["warning"] not in {"RESET_IN_PAST", "RESET_TOO_FAR", "DST_NONEXISTENT_TIME", "DST_AMBIGUOUS_TIME"},
            })
    reset_at = resets[0].get("value") if resets else None
    candidate = {
        "captured_at": captured_at,
        "remaining_percent": percents[0]["value"] if percents else None,
        "reset_at": reset_at,
        "measurement_scope": measurement_scope,
        "quota_scope": quota_scope,
        "quota_cycle_id": quota_cycle_id(measurement_scope, reset_at) if reset_at and measurement_scope == quota_scope else None,
        "purchased_credits_remaining": credits,
        "purchased_credits_status": credit_status,
        "source": "shortcut",
        "field_confidence": {
            "remaining_percent": _confidence(percents),
            "reset_at": _confidence(resets),
            "purchased_credits_remaining": "certain" if credit_items else "absent",
            "measurement_scope": "certain" if measurement_scope else "absent",
        },
        "field_provenance": {
            "remaining_percent": percents[:3],
            "reset_at": resets[:3],
            "purchased_credits_remaining": credit_items[:3],
            "measurement_scope": "shortcut_default",
        },
        "warnings": warnings,
        "raw_text_hash": raw_text_hash,
    }
    return ParseResult(candidate, {
        "remaining_percent": percents,
        "reset_at": resets,
        "purchased_credits_remaining": credit_items,
    })
