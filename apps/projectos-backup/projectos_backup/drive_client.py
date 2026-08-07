"""Resumable synchronization of the verified local mirror through Apps Script."""

from __future__ import annotations

import base64
from datetime import datetime, timezone
import hashlib
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import urllib.request
from urllib.parse import urlsplit, urlunsplit


MAX_RAW_FILE_BYTES = 7 * 1024 * 1024
MAX_BATCH_FILES = 4
MAX_BATCH_RAW_BYTES = 1024 * 1024
DEFAULT_TIMEOUT = 35
STATE_DIRECTORY = "DriveState"
STATE_FILE = "STATE.json"


class DriveSyncError(RuntimeError):
    pass


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".part")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(temporary, path)


def manifest_files(manifest: dict) -> dict[str, dict]:
    result = {}
    for source in manifest.get("sources", []):
        folder = source.get("folder", "")
        for record in source.get("files", []):
            path = PurePosixPath(folder, record["path"]).as_posix()
            result[path] = record
    return result


def normalize_apps_script_url(url: str) -> str:
    """Accept harmless iOS/Google copy artefacts while keeping the relay host strict."""
    cleaned = "".join(url.split()).strip("\\\"'“”")
    parsed = urlsplit(cleaned)
    path = parsed.path.rstrip("/")
    segments = path.split("/")
    valid = (
        parsed.scheme == "https"
        and parsed.hostname == "script.google.com"
        and segments[:3] == ["", "macros", "s"]
        and len(segments) == 5
        and bool(segments[3])
        and segments[4] == "exec"
    )
    if not valid:
        raise ValueError("URL Apps Script /exec invalide")
    return urlunsplit(("https", "script.google.com", path, "", ""))


class AppsScriptClient:
    def __init__(self, url: str, token: str, timeout: int = DEFAULT_TIMEOUT):
        normalized_url = normalize_apps_script_url(url)
        if len(token) < 24:
            raise ValueError("Le jeton doit contenir au moins 24 caractères")
        self.url, self.token, self.timeout = normalized_url, token, timeout

    def call(self, action: str, **payload) -> dict:
        body = json.dumps({"token": self.token, "action": action, **payload}).encode()
        request = urllib.request.Request(
            self.url, data=body, headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise DriveSyncError(f"Google Drive — {action} : {exc}") from exc
        if not result.get("ok"):
            raise DriveSyncError(f"Google Drive — {action} : {result.get('error', 'erreur inconnue')}")
        return result


def _plan_digest(sync_id: str, uploads: list[dict], deletes: list[str]) -> str:
    plan = {
        "syncId": sync_id,
        "uploads": [{"path": item["path"], "sha256": item["sha256"]} for item in uploads],
        "deletes": deletes,
    }
    raw = json.dumps(plan, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _upload_payload(current: Path, path: str, record: dict) -> tuple[dict, int]:
    source = current / Path(*PurePosixPath(path).parts)
    size = source.stat().st_size
    if size > MAX_RAW_FILE_BYTES:
        raise DriveSyncError(f"Fichier trop volumineux pour Apps Script ({size} octets) : {path}")
    return ({
        "path": path,
        "sha256": record["sha256"],
        "mimeType": mimetypes.guess_type(path)[0] or "application/octet-stream",
        "contentBase64": base64.b64encode(source.read_bytes()).decode("ascii"),
    }, size)


def _partition_uploads(current: Path, changed: list[str], local: dict) -> list[list[dict]]:
    batches: list[list[dict]] = []
    batch: list[dict] = []
    batch_bytes = 0
    for path in sorted(changed):
        item, size = _upload_payload(current, path, local[path])
        if size > MAX_BATCH_RAW_BYTES:
            if batch:
                batches.append(batch)
                batch, batch_bytes = [], 0
            batches.append([item])
            continue
        if batch and (len(batch) >= MAX_BATCH_FILES or batch_bytes + size > MAX_BATCH_RAW_BYTES):
            batches.append(batch)
            batch, batch_bytes = [], 0
        batch.append(item)
        batch_bytes += size
    if batch:
        batches.append(batch)
    return batches


def _status(client, sync_id: str, uploads: list[dict] | None = None, deletes: list[str] | None = None) -> dict:
    return client.call(
        "syncStatus", syncId=sync_id,
        uploads=[{"path": item["path"], "sha256": item["sha256"]} for item in uploads or []],
        deletes=deletes or [],
    )


def _send_upload_batch(client, sync_id: str, items: list[dict]) -> tuple[list[str], int]:
    """Send a batch, probing durable receipts after uncertain responses.

    A slow batch is split only for items not acknowledged by Apps Script. This
    makes retries safe even when iOS times out after Google has completed work.
    """
    try:
        result = client.call("uploadBatch", syncId=sync_id, files=items)
        return [item["path"] for item in items], int(result.get("resumed", 0))
    except DriveSyncError as original:
        try:
            status = _status(client, sync_id, uploads=items)
        except DriveSyncError:
            raise original
        received = set(status.get("receivedUploads", []))
        missing = [item for item in items if item["path"] not in received]
        resumed = len(items) - len(missing)
        if not missing:
            return [item["path"] for item in items], resumed
        if len(missing) == 1:
            try:
                result = client.call("uploadBatch", syncId=sync_id, files=missing)
                return [item["path"] for item in items], resumed + int(result.get("resumed", 0))
            except DriveSyncError as retry_error:
                status = _status(client, sync_id, uploads=missing)
                if missing[0]["path"] in set(status.get("receivedUploads", [])):
                    return [item["path"] for item in items], resumed + 1
                raise retry_error
        middle = len(missing) // 2
        left, resumed_left = _send_upload_batch(client, sync_id, missing[:middle])
        right, resumed_right = _send_upload_batch(client, sync_id, missing[middle:])
        return list(received) + left + right, resumed + resumed_left + resumed_right


def _save_state(state_path: Path, **values) -> None:
    previous = {}
    try:
        previous = json.loads(state_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        pass
    previous.update(values)
    previous["updatedAt"] = _utc_now()
    _write_json_atomic(state_path, previous)


def drive_state_path(current: Path) -> Path:
    return current.parent / STATE_DIRECTORY / STATE_FILE


def has_pending_drive_sync(current: Path) -> bool:
    """Return whether the verified mirror has a resumable Drive session."""
    try:
        state = json.loads(drive_state_path(current).read_text(encoding="utf-8"))
        manifest = json.loads((current / "MANIFEST.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    return (
        state.get("status") in {"running", "interrupted"}
        and bool(state.get("syncId"))
        and state.get("syncId") == manifest.get("runId")
        and manifest.get("status") == "complete"
    )


def sync_current(current: Path, client: AppsScriptClient, progress=None) -> dict:
    manifest_path = current / "MANIFEST.json"
    state_path = drive_state_path(current)
    try:
        local_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DriveSyncError("MANIFEST.json local absent ou invalide") from exc
    if local_manifest.get("status") != "complete" or not local_manifest.get("runId"):
        raise DriveSyncError("Le miroir local n'est pas validé")

    sync_id = str(local_manifest["runId"])
    uploaded = deleted_count = resumed = 0
    try:
        if progress:
            progress({"phase": "drive_prepare", "completed": 0, "total": 0})
        remote_manifest = client.call("manifest").get("manifest") or {}
        local, remote = manifest_files(local_manifest), manifest_files(remote_manifest)
        changed = sorted(path for path, item in local.items() if remote.get(path, {}).get("sha256") != item.get("sha256"))
        deleted = sorted(set(remote) - set(local))
        uploads_plan = [{"path": path, "sha256": local[path]["sha256"]} for path in changed]
        digest = _plan_digest(sync_id, uploads_plan, deleted)
        total = len(changed) + len(deleted) + 1

        begin = client.call(
            "beginSync", syncId=sync_id, planDigest=digest,
            uploadCount=len(changed), deleteCount=len(deleted),
        )
        resumed = int(begin.get("receivedUploads", 0)) + int(begin.get("receivedDeletes", 0))
        _save_state(
            state_path, status="running", syncId=sync_id, phase="upload",
            total=total, completed=resumed, resumedFiles=resumed,
        )

        completed = 0
        for batch in _partition_uploads(current, changed, local):
            status = _status(client, sync_id, uploads=batch)
            already = set(status.get("receivedUploads", []))
            pending = [item for item in batch if item["path"] not in already]
            if pending:
                _, recovered = _send_upload_batch(client, sync_id, pending)
                resumed += recovered
                uploaded += len(pending) - recovered
            completed += len(batch)
            path = batch[-1]["path"]
            _save_state(state_path, phase="upload", completed=completed, resumedFiles=resumed, path=path)
            if progress:
                progress({"phase": "upload", "completed": completed, "total": total, "path": path, "resumed": resumed})

        for offset in range(0, len(deleted), MAX_BATCH_FILES):
            paths = deleted[offset:offset + MAX_BATCH_FILES]
            status = _status(client, sync_id, deletes=paths)
            already = set(status.get("receivedDeletes", []))
            pending = [path for path in paths if path not in already]
            if pending:
                try:
                    result = client.call("deleteBatch", syncId=sync_id, paths=pending)
                    resumed += int(result.get("resumed", 0))
                    deleted_count += len(pending) - int(result.get("resumed", 0))
                except DriveSyncError as original:
                    status = _status(client, sync_id, deletes=pending)
                    confirmed = set(status.get("receivedDeletes", []))
                    if not all(path in confirmed for path in pending):
                        raise original
                    resumed += len(pending)
            completed += len(paths)
            path = paths[-1]
            _save_state(state_path, phase="delete", completed=completed, resumedFiles=resumed, path=path)
            if progress:
                progress({"phase": "delete", "completed": completed, "total": total, "path": path, "resumed": resumed})

        if progress:
            progress({"phase": "publish", "completed": completed, "total": total, "resumed": resumed})
        client.call(
            "finalizeSync", syncId=sync_id, planDigest=digest, manifest=local_manifest,
            uploads=uploads_plan, deletes=deleted,
        )
        verified_manifest = client.call("manifest").get("manifest") or {}
        if verified_manifest != local_manifest:
            raise DriveSyncError("MANIFEST.json Drive ne correspond pas au miroir local")
        if progress:
            progress({"phase": "complete", "completed": total, "total": total, "resumed": resumed})
        result = {
            "status": "complete", "uploaded_files": len(changed), "deleted_files": len(deleted),
            "unchanged_files": len(local) - len(changed), "verified_files": len(local),
            "resumed_files": resumed, "completedAt": _utc_now(),
        }
        _save_state(state_path, **result, phase="complete", completed=total, total=total)
        return result
    except Exception as exc:
        _save_state(
            state_path, status="interrupted", syncId=sync_id, phase="drive",
            uploadedFiles=uploaded, deletedFiles=deleted_count, resumedFiles=resumed, error=str(exc),
        )
        raise
