"""CLI bridge for iOS Shortcuts -> Pyto -> Agent Usage core.

Reads one UTF-8 JSON object from stdin and writes one JSON object to stdout.
No raw OCR text is logged or persisted.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import secrets
import sys
from time import perf_counter

from config import default_data_dir
from errors import AgentUsageError, ValidationError
from import_parser import normalize_for_hash, parse_usage_candidate
from import_snapshot import cancel_import, commit_import
from import_staging import StagingStore, validate_import_id

INPUT_MODES = {
    "image_ocr": "ocr",
    "clipboard_text": "clipboard",
    "manual_text": "manual",
}


def _secret_path() -> Path:
    return default_data_dir() / ".raw_text_hash_secret"


def _secret() -> bytes:
    path = _secret_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        value = secrets.token_bytes(16)
        try:
            fd = os.open(str(path), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "wb") as handle:
                handle.write(value.hex().encode("ascii"))
                handle.flush()
                os.fsync(handle.fileno())
        except FileExistsError:
            pass
    try:
        raw = path.read_text(encoding="ascii").strip()
        value = bytes.fromhex(raw)
    except (OSError, ValueError) as exc:
        raise ValidationError("local hash secret is unavailable or invalid") from exc
    if len(value) != 16:
        raise ValidationError("local hash secret has invalid length")
    return value


def protected_hash(text: str | None, input_mode: str) -> str | None:
    if input_mode == "manual" or text is None:
        return None
    digest = hashlib.sha256()
    digest.update(_secret())
    digest.update(b"\0")
    digest.update(normalize_for_hash(text).encode("utf-8"))
    return "sha256:" + digest.hexdigest()


def analyze(request: dict) -> dict:
    start = perf_counter()
    if request.get("schemaVersion") != 1 or request.get("import_type") != "usage_snapshot_analyze_request":
        raise ValidationError("invalid analyze request envelope")
    if request.get("source") != "shortcut":
        raise ValidationError("analyze source must be shortcut")
    import_id = validate_import_id(request.get("import_id"))
    captured_at = request.get("captured_at")
    measurement_scope = request.get("measurement_scope")
    quota_scope = request.get("quota_scope")
    if not all(isinstance(value, str) and value for value in (captured_at, measurement_scope, quota_scope)):
        raise ValidationError("captured_at and both scopes are required")

    transient = request.get("transient") or {}
    input_kind = transient.get("input_kind")
    input_mode = INPUT_MODES.get(input_kind)
    if input_mode is None:
        raise ValidationError("unsupported transient.input_kind")
    raw_text = transient.get("raw_text")
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValidationError("transient.raw_text is required")

    raw_hash = protected_hash(raw_text, input_mode)
    parsed = parse_usage_candidate(
        raw_text,
        captured_at,
        measurement_scope,
        quota_scope,
        request.get("timezone", "Europe/Paris"),
        input_mode,
        raw_hash,
    )
    duration = round((perf_counter() - start) * 1000, 3)
    staged = {
        "import_id": import_id,
        "input_mode": input_mode,
        "candidate": parsed.candidate,
        "candidate_sets": parsed.candidate_sets,
        "analysis_duration_ms": duration,
    }
    expires = StagingStore().save(import_id, staged)
    return {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_candidate",
        "status": "needs_confirmation",
        "import_id": import_id,
        "candidate": parsed.candidate,
        "candidate_sets": parsed.candidate_sets,
        "candidate_expires_at": expires,
        "analysis_duration_ms": duration,
    }


def dispatch(request: dict) -> dict:
    import_type = request.get("import_type")
    if import_type == "usage_snapshot_analyze_request":
        return analyze(request)
    if import_type == "usage_snapshot_commit_request":
        return commit_import(request)
    if import_type == "usage_snapshot_cancel_request" or request.get("action") == "cancel":
        return cancel_import(request)
    raise ValidationError("unsupported import_type")


def _public_error(exc: Exception) -> dict:
    if isinstance(exc, json.JSONDecodeError):
        code, message = "ANALYZE_JSON_INVALID", "Input is not valid JSON."
    elif isinstance(exc, FileNotFoundError):
        code, message = "STAGING_NOT_FOUND", "The staged candidate was not found."
    elif isinstance(exc, TimeoutError):
        code, message = "STAGING_EXPIRED", "The staged candidate has expired."
    elif isinstance(exc, AgentUsageError):
        code, message = exc.__class__.__name__.upper(), str(exc).splitlines()[0][:160]
    else:
        code, message = "INTERNAL_ERROR", "The local import could not be completed."
    return {
        "schemaVersion": 1,
        "import_type": "usage_snapshot_error",
        "status": "error",
        "error": {
            "code": code,
            "message": message,
            "recoverable": code != "INTERNAL_ERROR",
        },
        "stored": False,
    }


def main() -> int:
    try:
        request = json.loads(sys.stdin.read())
        if not isinstance(request, dict):
            raise ValidationError("request must be a JSON object")
        response = dispatch(request)
    except Exception as exc:
        response = _public_error(exc)
    print(json.dumps(response, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
