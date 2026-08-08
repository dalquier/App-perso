"""Resumable, append-only upload of conversation buffer packages to Drive."""

from __future__ import annotations

import base64
import json
import mimetypes
from pathlib import Path, PurePosixPath

from .conversation_buffer import (
    BUFFER_MANIFEST,
    ConversationBufferError,
    claim_pending,
    cleanup_verified,
    import_inbox,
    load_buffer_manifest,
    mark_failed,
    mark_verified,
    queue_items,
    queue_summary,
    verify_package,
)
from .drive_client import (
    AppsScriptClient,
    DriveSyncError,
    MAX_BATCH_FILES,
    MAX_BATCH_RAW_BYTES,
    MAX_RAW_FILE_BYTES,
    preflight_drive,
)


def _manifest_text(manifest: dict) -> str:
    return json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _session_id(manifest: dict) -> str:
    return f"archive:{manifest['archiveId']}:{manifest['manifestSha256'][:16]}"


def _safe_file(folder: Path, relative: str) -> Path:
    pure = PurePosixPath(relative)
    if pure.is_absolute() or not pure.parts or any(part in {"", ".", ".."} for part in pure.parts):
        raise ConversationBufferError(f"Chemin d’archive invalide : {relative}")
    return folder.joinpath(*pure.parts)


def _record_payload(folder: Path, record: dict) -> tuple[dict, int]:
    path = _safe_file(folder, record["path"])
    size = path.stat().st_size
    if size > MAX_RAW_FILE_BYTES:
        raise DriveSyncError(f"Fichier de conversation trop volumineux ({size} octets) : {record['path']}")
    return ({
        "path": record["path"],
        "sha256": record["sha256"],
        "mimeType": record.get("mimeType") or mimetypes.guess_type(record["path"])[0] or "application/octet-stream",
        "contentBase64": base64.b64encode(path.read_bytes()).decode("ascii"),
        "rawSize": size,
    }, size)


def _iter_batches(folder: Path, records: list[dict], progress=None):
    batch, batch_bytes = [], 0
    for index, record in enumerate(records, start=1):
        size = int(record["size"])
        if batch and (len(batch) >= MAX_BATCH_FILES or batch_bytes + size > MAX_BATCH_RAW_BYTES):
            yield batch
            batch, batch_bytes = [], 0
        if progress:
            progress({
                "phase": "archive_prepare", "completed": index, "total": len(records),
                "path": record["path"], "archiveId": folder.name,
            })
        payload, size = _record_payload(folder, record)
        if size > MAX_BATCH_RAW_BYTES:
            if batch:
                yield batch
                batch, batch_bytes = [], 0
            yield [payload]
            continue
        batch.append(payload); batch_bytes += size
    if batch:
        yield batch


def _archive_status(client: AppsScriptClient, manifest: dict, uploads=None) -> dict:
    return client.read(
        "archiveStatus",
        syncId=_session_id(manifest),
        archiveId=manifest["archiveId"],
        manifestSha256=manifest["manifestSha256"],
        uploads=uploads or [],
    )


def _send_batch(client: AppsScriptClient, manifest: dict, items: list[dict]) -> tuple[int, int]:
    """Return newly uploaded and resumed counts, proving ambiguous responses via GET."""
    try:
        if len(items) == 1 and int(items[0].get("rawSize", 0)) > MAX_BATCH_RAW_BYTES:
            result = client.call(
                "archiveUpload", syncId=_session_id(manifest), archiveId=manifest["archiveId"], **items[0],
            )
        else:
            result = client.call(
                "archiveUploadBatch", syncId=_session_id(manifest), archiveId=manifest["archiveId"], files=items,
            )
        resumed = int(result.get("resumed", 0))
        return len(items) - resumed, resumed
    except DriveSyncError as original:
        try:
            status = _archive_status(
                client, manifest,
                uploads=[{"path": item["path"], "sha256": item["sha256"]} for item in items],
            )
        except DriveSyncError:
            raise original
        received = set(status.get("receivedUploads", []))
        missing = [item for item in items if item["path"] not in received]
        if not missing:
            return 0, len(items)
        if len(missing) == 1:
            if int(missing[0].get("rawSize", 0)) > MAX_BATCH_RAW_BYTES:
                result = client.call(
                    "archiveUpload", syncId=_session_id(manifest), archiveId=manifest["archiveId"], **missing[0],
                )
            else:
                result = client.call(
                    "archiveUploadBatch", syncId=_session_id(manifest), archiveId=manifest["archiveId"], files=missing,
                )
            resumed = len(items) - 1 + int(result.get("resumed", 0))
            return 1 - int(result.get("resumed", 0)), resumed
        middle = len(missing) // 2
        left = _send_batch(client, manifest, missing[:middle])
        right = _send_batch(client, manifest, missing[middle:])
        return left[0] + right[0], len(items) - len(missing) + left[1] + right[1]


def _require_archive_protocol(result: dict) -> None:
    if int(result.get("protocol", 0)) < 3:
        raise DriveSyncError(
            "Apps Script doit être redéployé pour activer les archives de conversations",
            code="protocol", stage="archive", retryable=False,
        )


def sync_archive(
    folder: str | Path, root: str | Path, client: AppsScriptClient, progress=None,
    should_cancel=None, preflight_result: dict | None = None,
) -> dict:
    folder, root = Path(folder), Path(root)
    if folder.parent.name == "Pending":
        folder = claim_pending(root, folder.name)
    try:
        manifest = verify_package(folder)
    except ConversationBufferError as exc:
        mark_failed(folder, root, str(exc))
        raise
    sync_id = _session_id(manifest)
    records = sorted(manifest["files"], key=lambda item: item["path"])
    uploads_plan = [{"path": item["path"], "sha256": item["sha256"]} for item in records]
    if should_cancel and should_cancel():
        raise DriveSyncError("Archivage interrompu par iOS", code="cancelled", stage="archive")

    preflight = preflight_result or preflight_drive(client, progress=progress, should_cancel=should_cancel)
    _require_archive_protocol(preflight)
    status = _archive_status(client, manifest, uploads=uploads_plan)
    if status.get("finalized") is True:
        target = mark_verified(folder, root, status)
        return {"archiveId": manifest["archiveId"], "uploaded": 0, "resumed": len(records), "folder": str(target)}

    try:
        client.call(
            "archiveBegin", syncId=sync_id, archiveId=manifest["archiveId"],
            manifestSha256=manifest["manifestSha256"], uploadCount=len(records),
        )
    except DriveSyncError as begin_error:
        status = _archive_status(client, manifest, uploads=uploads_plan)
        if status.get("status") not in {"active", "finalized"}:
            raise begin_error

    uploaded = resumed = completed = 0
    for batch in _iter_batches(folder, records, progress=progress):
        if should_cancel and should_cancel():
            raise DriveSyncError("Archivage interrompu par iOS", code="cancelled", stage="archive")
        batch_plan = [{"path": item["path"], "sha256": item["sha256"]} for item in batch]
        status = _archive_status(client, manifest, uploads=batch_plan)
        received = set(status.get("receivedUploads", []))
        pending = [item for item in batch if item["path"] not in received]
        resumed += len(batch) - len(pending)
        if pending:
            new_count, recovered = _send_batch(client, manifest, pending)
            uploaded += new_count; resumed += recovered
        completed += len(batch)
        if progress:
            progress({
                "phase": "archive_upload", "completed": completed, "total": len(records),
                "path": batch[-1]["path"], "archiveId": manifest["archiveId"], "resumed": resumed,
            })

    if progress:
        progress({"phase": "archive_verify", "archiveId": manifest["archiveId"]})
    manifest_text = _manifest_text(manifest)
    try:
        client.call(
            "archiveFinalize", syncId=sync_id, archiveId=manifest["archiveId"],
            manifestSha256=manifest["manifestSha256"], manifestText=manifest_text,
            uploads=uploads_plan,
        )
    except DriveSyncError as finalize_error:
        status = _archive_status(client, manifest, uploads=uploads_plan)
        if status.get("finalized") is not True:
            raise finalize_error
    status = _archive_status(client, manifest, uploads=uploads_plan)
    if status.get("finalized") is not True or status.get("manifestSha256") != manifest["manifestSha256"]:
        raise DriveSyncError("Archive Drive non vérifiée", code="archive_verify", stage="archiveFinalize")
    target = mark_verified(folder, root, status)
    return {"archiveId": manifest["archiveId"], "uploaded": uploaded, "resumed": resumed, "folder": str(target)}


def sync_conversation_buffer(root: str | Path, client: AppsScriptClient, progress=None, should_cancel=None) -> dict:
    root = Path(root)
    imported = import_inbox(root)
    removed = cleanup_verified(root)
    results, errors = [], []
    items = queue_items(root, states=("Uploading", "Pending"))
    preflight = None
    if items:
        try:
            preflight = preflight_drive(client, progress=progress, should_cancel=should_cancel)
            _require_archive_protocol(preflight)
        except Exception as exc:
            return {
                "imported": len(imported), "verified": 0, "removed": len(removed),
                "uploaded": 0, "resumed": 0, "pending": queue_summary(root)["pendingTotal"],
                "errors": [{"archiveId": "connection", "error": str(exc)}],
            }
    for index, item in enumerate(items, start=1):
        if progress:
            progress({
                "phase": "archive_queue", "completed": index - 1, "total": len(items),
                "archiveId": item["archiveId"],
            })
        try:
            results.append(sync_archive(
                item["folder"], root, client, progress=progress,
                should_cancel=should_cancel, preflight_result=preflight,
            ))
        except Exception as exc:
            errors.append({"archiveId": item["archiveId"], "error": str(exc)})
            if isinstance(exc, DriveSyncError) and not exc.retryable:
                break
            if should_cancel and should_cancel():
                break
    summary = queue_summary(root)
    return {
        "imported": len(imported), "verified": len(results), "removed": len(removed),
        "uploaded": sum(item["uploaded"] for item in results),
        "resumed": sum(item["resumed"] for item in results),
        "pending": summary["pendingTotal"], "errors": errors,
    }
