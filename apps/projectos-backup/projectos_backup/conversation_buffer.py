"""Durable iCloud staging queue for Codex and selected ChatGPT archives."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil
from typing import Iterable


BUFFER_SCHEMA_VERSION = 1
BUFFER_DIRECTORY = "ConversationBuffer"
BUFFER_MANIFEST = "BUFFER_MANIFEST.json"
RETENTION_DAYS = 30
STATES = ("Inbox", "Pending", "Uploading", "Verified", "Failed", "Quarantine")
ARCHIVE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$")


class ConversationBufferError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def buffer_root(destination: str | Path) -> Path:
    return Path(destination).expanduser() / BUFFER_DIRECTORY


def initialize_buffer(root: str | Path) -> Path:
    root = Path(root)
    for state in STATES:
        (root / state).mkdir(parents=True, exist_ok=True)
    return root


def _write_json_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".part")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(temporary, path)


def _sha256(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _manifest_sha(manifest: dict) -> str:
    canonical = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def validate_archive_id(value: str) -> str:
    value = str(value).strip()
    if not ARCHIVE_ID_PATTERN.fullmatch(value):
        raise ConversationBufferError("Identifiant d’archive invalide")
    return value


def _inventory(folder: Path) -> list[dict]:
    records = []
    for path in sorted(folder.rglob("*")):
        if not path.is_file() or path.name == BUFFER_MANIFEST or path.is_symlink():
            continue
        relative = path.relative_to(folder).as_posix()
        records.append({
            "path": relative,
            "size": path.stat().st_size,
            "sha256": _sha256(path),
            "mimeType": mimetypes.guess_type(relative)[0] or "application/octet-stream",
        })
    return records


def _has_transcript(folder: Path) -> bool:
    return any((folder / name).is_file() for name in ("conversation.jsonl", "conversation.md"))


def capture_package(source: str | Path, root: str | Path, archive_id: str | None = None) -> dict:
    """Copy a complete package atomically into Pending without trusting its own manifest."""
    source, root = Path(source), initialize_buffer(root)
    if not source.is_dir():
        raise ConversationBufferError(f"Paquet de conversation inaccessible : {source}")
    archive_id = validate_archive_id(archive_id or source.name.removesuffix(".part"))
    pending = root / "Pending" / archive_id
    if pending.exists():
        existing = load_buffer_manifest(pending)
        if existing.get("archiveId") == archive_id:
            return existing
        raise ConversationBufferError(f"Archive en attente contradictoire : {archive_id}")
    for state in ("Uploading", "Verified"):
        existing_folder = root / state / archive_id
        if existing_folder.exists():
            return load_buffer_manifest(existing_folder)

    temporary = root / "Pending" / f".{archive_id}.part"
    if temporary.exists():
        shutil.rmtree(temporary)
    try:
        shutil.copytree(source, temporary, symlinks=False, ignore=shutil.ignore_patterns(BUFFER_MANIFEST))
        if not _has_transcript(temporary):
            raise ConversationBufferError("Transcription absente : conversation.jsonl ou conversation.md requis")
        files = _inventory(temporary)
        manifest = {
            "schemaVersion": BUFFER_SCHEMA_VERSION,
            "archiveId": archive_id,
            "status": "pending",
            "capturedAt": utc_now(),
            "retentionDaysAfterVerification": RETENTION_DAYS,
            "fileCount": len(files),
            "totalBytes": sum(item["size"] for item in files),
            "files": files,
        }
        manifest["manifestSha256"] = _manifest_sha(manifest)
        _write_json_atomic(temporary / BUFFER_MANIFEST, manifest)
        os.replace(temporary, pending)
        return manifest
    except Exception:
        shutil.rmtree(temporary, ignore_errors=True)
        raise


def import_inbox(root: str | Path) -> list[dict]:
    root = initialize_buffer(root)
    imported = []
    for package in sorted((root / "Inbox").iterdir()):
        if not package.is_dir() or package.name.startswith(".") or package.name.endswith(".part"):
            continue
        try:
            manifest = capture_package(package, root)
            imported.append(manifest)
            shutil.rmtree(package)
        except Exception as exc:
            quarantine = root / "Quarantine" / package.name
            if quarantine.exists():
                quarantine = root / "Quarantine" / f"{package.name}-{int(datetime.now().timestamp())}"
            os.replace(package, quarantine)
            _write_json_atomic(quarantine / "IMPORT_ERROR.json", {
                "status": "quarantined", "at": utc_now(), "error": str(exc),
            })
    return imported


def load_buffer_manifest(folder: str | Path) -> dict:
    try:
        payload = json.loads((Path(folder) / BUFFER_MANIFEST).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ConversationBufferError(f"Manifeste tampon absent ou invalide : {folder}") from exc
    if (
        payload.get("schemaVersion") != BUFFER_SCHEMA_VERSION
        or not ARCHIVE_ID_PATTERN.fullmatch(str(payload.get("archiveId", "")))
        or not isinstance(payload.get("files"), list)
    ):
        raise ConversationBufferError(f"Manifeste tampon incompatible : {folder}")
    return payload


def verify_package(folder: str | Path, manifest: dict | None = None) -> dict:
    folder = Path(folder)
    manifest = manifest or load_buffer_manifest(folder)
    digest_payload = dict(manifest)
    manifest_sha = digest_payload.pop("manifestSha256", "")
    if not re.fullmatch(r"[a-f0-9]{64}", str(manifest_sha)) or _manifest_sha(digest_payload) != manifest_sha:
        raise ConversationBufferError("Empreinte du manifeste tampon invalide")
    expected_paths = set()
    for record in manifest["files"]:
        relative = str(record.get("path", ""))
        parts = Path(relative).parts
        if not relative or relative.startswith("/") or ".." in parts:
            raise ConversationBufferError(f"Chemin d’archive invalide : {relative}")
        path = folder.joinpath(*parts)
        if not path.is_file() or path.stat().st_size != record.get("size") or _sha256(path) != record.get("sha256"):
            raise ConversationBufferError(f"Fichier tampon altéré : {relative}")
        expected_paths.add(relative)
    actual_paths = {path.relative_to(folder).as_posix() for path in folder.rglob("*") if path.is_file() and path.name != BUFFER_MANIFEST}
    if actual_paths != expected_paths:
        raise ConversationBufferError("Le contenu du tampon ne correspond pas au manifeste")
    return manifest


def claim_pending(root: str | Path, archive_id: str) -> Path:
    root, archive_id = initialize_buffer(root), validate_archive_id(archive_id)
    uploading = root / "Uploading" / archive_id
    if uploading.exists():
        return uploading
    pending = root / "Pending" / archive_id
    if not pending.exists():
        raise ConversationBufferError(f"Archive en attente absente : {archive_id}")
    os.replace(pending, uploading)
    return uploading


def mark_verified(folder: str | Path, root: str | Path, remote: dict) -> Path:
    folder, root = Path(folder), initialize_buffer(root)
    manifest = verify_package(folder)
    manifest.update({
        "status": "verified",
        "verifiedAt": utc_now(),
        "remoteVerified": True,
        "remoteFolder": remote.get("folder", f"ConversationArchives/{manifest['archiveId']}"),
        "remoteManifestSha256": remote.get("manifestSha256", manifest.get("manifestSha256")),
    })
    _write_json_atomic(folder / BUFFER_MANIFEST, manifest)
    target = root / "Verified" / manifest["archiveId"]
    if target.exists():
        shutil.rmtree(target)
    os.replace(folder, target)
    return target


def mark_failed(folder: str | Path, root: str | Path, error: str) -> Path:
    folder, root = Path(folder), initialize_buffer(root)
    try:
        manifest = load_buffer_manifest(folder)
    except ConversationBufferError:
        manifest = {"schemaVersion": BUFFER_SCHEMA_VERSION, "archiveId": folder.name}
    manifest.update({"status": "failed", "failedAt": utc_now(), "error": str(error)[:500]})
    _write_json_atomic(folder / BUFFER_MANIFEST, manifest)
    target = root / "Failed" / validate_archive_id(manifest["archiveId"])
    if target.exists():
        target = root / "Failed" / f"{manifest['archiveId']}-{int(datetime.now().timestamp())}"
    os.replace(folder, target)
    return target


def queue_items(root: str | Path, states: Iterable[str] = STATES[1:]) -> list[dict]:
    root = initialize_buffer(root)
    result = []
    for state in states:
        state_root = root / state
        if not state_root.exists():
            continue
        for folder in sorted(state_root.iterdir()):
            if not folder.is_dir() or folder.name.startswith("."):
                continue
            try:
                manifest = load_buffer_manifest(folder)
                result.append({"state": state, "folder": str(folder), **manifest})
            except ConversationBufferError:
                result.append({"state": state, "folder": str(folder), "archiveId": folder.name, "status": "invalid"})
    return result


def queue_summary(root: str | Path) -> dict:
    counts = {state: 0 for state in STATES}
    for item in queue_items(root):
        counts[item["state"]] += 1
    counts["Inbox"] = sum(1 for item in (initialize_buffer(root) / "Inbox").iterdir() if item.is_dir())
    counts["pendingTotal"] = counts["Inbox"] + counts["Pending"] + counts["Uploading"] + counts["Failed"]
    return counts


def cleanup_verified(root: str | Path, now: datetime | None = None, retention_days: int = RETENTION_DAYS) -> list[str]:
    root = initialize_buffer(root)
    now = now or datetime.now(timezone.utc)
    removed = []
    for folder in sorted((root / "Verified").iterdir()):
        if not folder.is_dir():
            continue
        try:
            manifest = load_buffer_manifest(folder)
            verified_at = datetime.fromisoformat(str(manifest["verifiedAt"]).replace("Z", "+00:00"))
            eligible = manifest.get("remoteVerified") is True and now - verified_at >= timedelta(days=retention_days)
        except (ConversationBufferError, KeyError, ValueError, TypeError):
            eligible = False
        if eligible:
            shutil.rmtree(folder)
            removed.append(folder.name)
    return removed
