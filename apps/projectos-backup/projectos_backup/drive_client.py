"""Incremental upload of the verified local mirror through an Apps Script relay."""

from __future__ import annotations

import base64
import json
import mimetypes
from pathlib import Path, PurePosixPath
import urllib.request
from urllib.parse import urlsplit, urlunsplit


MAX_RAW_FILE_BYTES = 7 * 1024 * 1024
MAX_BATCH_FILES = 20
MAX_BATCH_RAW_BYTES = 5 * 1024 * 1024


class DriveSyncError(RuntimeError):
    pass


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
    def __init__(self, url: str, token: str, timeout: int = 60):
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
            raise DriveSyncError(f"Relais Google Drive inaccessible : {exc}") from exc
        if not result.get("ok"):
            raise DriveSyncError(result.get("error", "Erreur Google Drive inconnue"))
        return result


def _is_unknown_action(exc: DriveSyncError) -> bool:
    return "action inconnue" in str(exc).casefold()


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


def _upload_batches(current: Path, changed: list[str], local: dict, client, completed: int, total: int, progress):
    batch, batch_bytes = [], 0

    def send(items):
        nonlocal completed
        if not items:
            return
        try:
            client.call("uploadBatch", files=items)
        except DriveSyncError as exc:
            if not _is_unknown_action(exc):
                raise
            for item in items:
                client.call("upload", **item)
        for item in items:
            completed += 1
            if progress:
                progress({"phase": "upload", "completed": completed, "total": total, "path": item["path"]})

    for path in sorted(changed):
        item, size = _upload_payload(current, path, local[path])
        if size > MAX_BATCH_RAW_BYTES:
            send(batch); batch, batch_bytes = [], 0
            client.call("upload", **item)
            completed += 1
            if progress:
                progress({"phase": "upload", "completed": completed, "total": total, "path": path})
            continue
        if batch and (len(batch) >= MAX_BATCH_FILES or batch_bytes + size > MAX_BATCH_RAW_BYTES):
            send(batch); batch, batch_bytes = [], 0
        batch.append(item); batch_bytes += size
    send(batch)
    return completed


def sync_current(current: Path, client: AppsScriptClient, progress=None) -> dict:
    manifest_path = current / "MANIFEST.json"
    try:
        local_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise DriveSyncError("MANIFEST.json local absent ou invalide") from exc
    if local_manifest.get("status") != "complete":
        raise DriveSyncError("Le miroir local n'est pas validé")
    remote_manifest = client.call("manifest").get("manifest") or {}
    local, remote = manifest_files(local_manifest), manifest_files(remote_manifest)
    changed = [path for path, item in local.items() if remote.get(path, {}).get("sha256") != item.get("sha256")]
    deleted = sorted(set(remote) - set(local))
    total = len(changed) + len(deleted) + 1
    completed = _upload_batches(current, changed, local, client, 0, total, progress)
    for offset in range(0, len(deleted), MAX_BATCH_FILES):
        paths = deleted[offset:offset + MAX_BATCH_FILES]
        try:
            client.call("deleteBatch", paths=paths)
        except DriveSyncError as exc:
            if not _is_unknown_action(exc):
                raise
            for path in paths:
                client.call("delete", path=path)
        for path in paths:
            completed += 1
            if progress:
                progress({"phase": "delete", "completed": completed, "total": total, "path": path})
    client.call("finalize", manifest=local_manifest)
    verified_manifest = client.call("manifest").get("manifest") or {}
    if verified_manifest != local_manifest:
        raise DriveSyncError("MANIFEST.json Drive ne correspond pas au miroir local")
    if progress:
        progress({"phase": "complete", "completed": total, "total": total})
    return {
        "status": "complete", "uploaded_files": len(changed), "deleted_files": len(deleted),
        "unchanged_files": len(local) - len(changed), "verified_files": len(local),
    }
