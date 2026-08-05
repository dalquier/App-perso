"""Pure-Python backup engine used by the Pyto application.

The engine never mutates a source. It builds a complete candidate snapshot in
``Staging`` and only replaces ``Current`` after every source archive passes a
ZIP integrity check and its SHA-256 has been computed.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import time
from typing import Iterable
import unicodedata
import zipfile


SCHEMA_VERSION = 1
APP_VERSION = "0.1.0"
DEFAULT_IGNORED_DIRECTORIES = frozenset({".git", "__pycache__", ".pytest_cache", ".mypy_cache"})
DEFAULT_IGNORED_FILES = frozenset({".DS_Store"})


class BackupError(RuntimeError):
    """Base error for a backup run."""


class SourceAccessError(BackupError):
    """A source is absent, unreadable, or contains an unreadable item."""


class UnsafeLayoutError(BackupError):
    """Sources and destination overlap or sources overlap each other."""


@dataclass(frozen=True)
class Source:
    source_id: str
    label: str
    path: str


@dataclass(frozen=True)
class FileRecord:
    path: str
    size: int
    sha256: str


@dataclass(frozen=True)
class ArchiveRecord:
    source_id: str
    label: str
    archive: str
    file_count: int
    uncompressed_bytes: int
    archive_bytes: int
    sha256: str


@dataclass(frozen=True)
class BackupResult:
    status: str
    run_id: str
    current_path: str
    bundle_path: str
    bundle_sha256: str
    manifest_path: str
    archives: tuple[ArchiveRecord, ...]

    def to_dict(self) -> dict:
        payload = asdict(self)
        payload["archives"] = [asdict(item) for item in self.archives]
        return payload


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def unique_suffix() -> str:
    """Return a collision-resistant local suffix without requiring /dev/urandom."""
    seed = f"{time.time_ns()}:{os.getpid()}:{id(object())}".encode("utf-8")
    return hashlib.sha256(seed).hexdigest()[:12]


def sanitize_name(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", ascii_value.strip()).strip(".-")
    return normalized or "source"


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _canonical(path: Path) -> Path:
    try:
        return path.expanduser().resolve(strict=True)
    except OSError as exc:
        raise SourceAccessError(f"Chemin inaccessible : {path}") from exc


def _is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_layout(sources: Iterable[Source], destination: Path) -> tuple[tuple[Source, Path], ...]:
    destination = destination.expanduser().resolve(strict=False)
    resolved: list[tuple[Source, Path]] = []
    for source in sources:
        path = _canonical(Path(source.path))
        if not path.is_dir():
            raise SourceAccessError(f"La source n'est pas un dossier : {source.label}")
        if _is_relative_to(destination, path) or _is_relative_to(path, destination):
            raise UnsafeLayoutError(f"La destination et la source se chevauchent : {source.label}")
        for previous, previous_path in resolved:
            if _is_relative_to(path, previous_path) or _is_relative_to(previous_path, path):
                raise UnsafeLayoutError(
                    f"Les sources se chevauchent : {previous.label} / {source.label}"
                )
        resolved.append((source, path))
    if not resolved:
        raise BackupError("Aucune source active")
    return tuple(resolved)


def iter_source_files(root: Path) -> Iterable[tuple[Path, str]]:
    """Yield regular files in deterministic order without following symlinks."""
    def fail_on_walk_error(error: OSError) -> None:
        raise SourceAccessError(f"Lecture impossible : {error.filename or root}") from error

    for current, directories, filenames in os.walk(
        root, topdown=True, onerror=fail_on_walk_error, followlinks=False
    ):
        current_path = Path(current)
        directories[:] = sorted(
            name
            for name in directories
            if name not in DEFAULT_IGNORED_DIRECTORIES
            and not (current_path / name).is_symlink()
        )
        for filename in sorted(filenames):
            if filename in DEFAULT_IGNORED_FILES:
                continue
            path = current_path / filename
            if path.is_symlink() or not path.is_file():
                continue
            yield path, path.relative_to(root).as_posix()


def build_source_archive(source: Source, root: Path, output: Path, run_id: str) -> ArchiveRecord:
    output.parent.mkdir(parents=True, exist_ok=True)
    records: list[FileRecord] = []
    try:
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for path, relative in iter_source_files(root):
                digest = hashlib.sha256()
                size = 0
                with path.open("rb") as source_handle, archive.open(f"files/{relative}", "w") as target:
                    while True:
                        chunk = source_handle.read(1024 * 1024)
                        if not chunk:
                            break
                        target.write(chunk)
                        digest.update(chunk)
                        size += len(chunk)
                records.append(FileRecord(relative, size, digest.hexdigest()))
            source_manifest = {
                "schemaVersion": SCHEMA_VERSION,
                "appVersion": APP_VERSION,
                "runId": run_id,
                "sourceId": source.source_id,
                "label": source.label,
                "createdAt": utc_now(),
                "fileCount": len(records),
                "uncompressedBytes": sum(item.size for item in records),
                "ignoredDirectories": sorted(DEFAULT_IGNORED_DIRECTORIES),
                "ignoredFiles": sorted(DEFAULT_IGNORED_FILES),
                "files": [asdict(item) for item in records],
            }
            archive.writestr(
                "SOURCE_MANIFEST.json",
                json.dumps(source_manifest, ensure_ascii=False, indent=2, sort_keys=True),
            )
    except (OSError, PermissionError, zipfile.BadZipFile) as exc:
        output.unlink(missing_ok=True)
        raise SourceAccessError(f"Lecture impossible dans {source.label}: {exc}") from exc

    verify_source_archive(output, source.label)

    return ArchiveRecord(
        source_id=source.source_id,
        label=source.label,
        archive=output.name,
        file_count=len(records),
        uncompressed_bytes=sum(item.size for item in records),
        archive_bytes=output.stat().st_size,
        sha256=sha256_file(output),
    )


def verify_source_archive(path: Path, label: str = "source") -> None:
    """Verify CRC, inventory, byte counts and hashes from the bytes stored in ZIP."""
    try:
        with zipfile.ZipFile(path, "r") as archive:
            bad = archive.testzip()
            if bad is not None or "SOURCE_MANIFEST.json" not in archive.namelist():
                raise BackupError(f"Archive invalide pour {label}: {bad or 'manifeste absent'}")
            manifest = json.loads(archive.read("SOURCE_MANIFEST.json").decode("utf-8"))
            records = manifest.get("files")
            if not isinstance(records, list) or manifest.get("fileCount") != len(records):
                raise BackupError(f"Inventaire incohérent pour {label}")
            for record in records:
                member = f"files/{record['path']}"
                digest = hashlib.sha256()
                size = 0
                with archive.open(member, "r") as handle:
                    while True:
                        chunk = handle.read(1024 * 1024)
                        if not chunk:
                            break
                        digest.update(chunk)
                        size += len(chunk)
                if size != record.get("size") or digest.hexdigest() != record.get("sha256"):
                    raise BackupError(f"Empreinte invalide pour {label}/{record['path']}")
    except (KeyError, json.JSONDecodeError, OSError, zipfile.BadZipFile) as exc:
        raise BackupError(f"Archive illisible pour {label}: {exc}") from exc


def _write_json_atomic(path: Path, payload: dict) -> None:
    temporary = path.with_suffix(path.suffix + ".part")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    os.replace(temporary, path)


def _make_bundle(candidate: Path, run_id: str) -> Path:
    bundle = candidate.parent / "ProjectOS-Backup-Current.zip"
    with zipfile.ZipFile(bundle, "w", compression=zipfile.ZIP_STORED) as archive:
        for path in sorted(candidate.iterdir(), key=lambda item: item.name):
            if path.is_file():
                archive.write(path, arcname=f"Current/{path.name}")
    with zipfile.ZipFile(bundle, "r") as archive:
        if archive.testzip() is not None:
            raise BackupError("Le bundle global est corrompu")
    return bundle


def _publish_candidate(destination: Path, candidate: Path, bundle: Path, run_id: str) -> tuple[Path, Path]:
    current = destination / "Current"
    current_bundle = destination / "ProjectOS-Backup-Current.zip"
    previous = destination / f".previous-{run_id}"
    previous_bundle = destination / f".previous-{run_id}.zip"
    moved_current = False
    moved_bundle = False
    installed_current = False
    installed_bundle = False
    try:
        if current.exists():
            os.replace(current, previous)
            moved_current = True
        if current_bundle.exists():
            os.replace(current_bundle, previous_bundle)
            moved_bundle = True
        os.replace(candidate, current)
        installed_current = True
        os.replace(bundle, current_bundle)
        installed_bundle = True
    except OSError as exc:
        if installed_current and current.exists():
            shutil.rmtree(current, ignore_errors=True)
        if installed_bundle and current_bundle.exists():
            current_bundle.unlink(missing_ok=True)
        if moved_current and previous.exists():
            os.replace(previous, current)
        if moved_bundle and previous_bundle.exists():
            os.replace(previous_bundle, current_bundle)
        raise BackupError(f"Publication atomique impossible : {exc}") from exc
    shutil.rmtree(previous, ignore_errors=True)
    previous_bundle.unlink(missing_ok=True)
    return current, current_bundle


def _recover_interrupted_publish(destination: Path) -> None:
    """Restore the previous pair when an earlier process stopped mid-publication."""
    current = destination / "Current"
    current_bundle = destination / "ProjectOS-Backup-Current.zip"
    previous_directories = sorted(destination.glob(".previous-*"), key=lambda item: item.name)
    previous_directories = [item for item in previous_directories if item.is_dir()]
    for previous in previous_directories:
        suffix = previous.name.removeprefix(".previous-")
        previous_bundle = destination / f".previous-{suffix}.zip"
        if current.exists() and current_bundle.exists():
            shutil.rmtree(previous, ignore_errors=True)
            previous_bundle.unlink(missing_ok=True)
            continue
        if current.exists():
            shutil.rmtree(current, ignore_errors=True)
        if current_bundle.exists() and previous_bundle.exists():
            current_bundle.unlink(missing_ok=True)
        os.replace(previous, current)
        if previous_bundle.exists():
            os.replace(previous_bundle, current_bundle)
    if current.exists() and current_bundle.exists():
        for orphan in destination.glob(".previous-*.zip"):
            orphan.unlink(missing_ok=True)


def _clean_staging(destination: Path) -> None:
    staging = destination / "Staging"
    if not staging.exists():
        return
    for child in staging.iterdir():
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
        else:
            child.unlink(missing_ok=True)


def run_backup(sources: Iterable[Source], destination: str | Path) -> BackupResult:
    """Build, verify and publish one current snapshot for all active sources."""
    destination_path = Path(destination).expanduser()
    resolved = validate_layout(tuple(sources), destination_path)
    destination_path.mkdir(parents=True, exist_ok=True)
    _recover_interrupted_publish(destination_path)
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + unique_suffix()
    run_root = destination_path / "Staging" / run_id
    candidate = run_root / "Current"
    candidate.mkdir(parents=True, exist_ok=False)
    archives: list[ArchiveRecord] = []
    try:
        used_names: set[str] = set()
        for source, root in resolved:
            base = sanitize_name(source.label)
            name = base
            index = 2
            while name.casefold() in used_names:
                name = f"{base}-{index}"
                index += 1
            used_names.add(name.casefold())
            record = build_source_archive(source, root, candidate / f"{name}.zip", run_id)
            archives.append(record)

        manifest = {
            "schemaVersion": SCHEMA_VERSION,
            "appVersion": APP_VERSION,
            "status": "complete",
            "runId": run_id,
            "createdAt": utc_now(),
            "sourceCount": len(archives),
            "fileCount": sum(item.file_count for item in archives),
            "uncompressedBytes": sum(item.uncompressed_bytes for item in archives),
            "archives": [asdict(item) for item in archives],
        }
        _write_json_atomic(candidate / "MANIFEST.json", manifest)
        manifest["bundle"] = {"name": "ProjectOS-Backup-Current.zip"}
        _write_json_atomic(candidate / "MANIFEST.json", manifest)
        bundle = _make_bundle(candidate, run_id)
        current, current_bundle = _publish_candidate(destination_path, candidate, bundle, run_id)
        bundle_sha256 = sha256_file(current_bundle)
        shutil.rmtree(run_root, ignore_errors=True)
        _clean_staging(destination_path)
        return BackupResult(
            status="complete",
            run_id=run_id,
            current_path=str(current),
            bundle_path=str(current_bundle),
            bundle_sha256=bundle_sha256,
            manifest_path=str(current / "MANIFEST.json"),
            archives=tuple(archives),
        )
    except Exception:
        shutil.rmtree(run_root, ignore_errors=True)
        raise
