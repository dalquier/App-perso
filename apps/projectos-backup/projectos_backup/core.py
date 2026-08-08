"""Transactional incremental mirror engine for ProjectOS Backup."""

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
from typing import Callable, Iterable
import unicodedata

SCHEMA_VERSION = 2
APP_VERSION = "0.4.0"
DEFAULT_IGNORED_DIRECTORIES = frozenset({".git", "__pycache__", ".pytest_cache", ".mypy_cache"})
DEFAULT_IGNORED_FILES = frozenset({".DS_Store"})
PrepareFile = Callable[[Path], bool]
ProgressCallback = Callable[[dict], None]
CancellationCheck = Callable[[], bool]


class BackupError(RuntimeError):
    pass


class SourceAccessError(BackupError):
    pass


class UnsafeLayoutError(BackupError):
    pass


@dataclass(frozen=True)
class Source:
    source_id: str
    label: str
    path: str


@dataclass(frozen=True)
class FilterRules:
    """User-configurable exclusions applied consistently to every source."""

    ignored_directories: frozenset[str] = DEFAULT_IGNORED_DIRECTORIES
    ignored_files: frozenset[str] = DEFAULT_IGNORED_FILES
    ignored_extensions: frozenset[str] = frozenset()

    @classmethod
    def from_config(cls, payload: dict | None) -> "FilterRules":
        payload = payload if isinstance(payload, dict) else {}

        def names(key: str, defaults=frozenset()) -> frozenset[str]:
            raw = payload.get(key, defaults)
            if not isinstance(raw, (list, tuple, set, frozenset)):
                raw = defaults
            return frozenset(str(item).strip() for item in raw if str(item).strip())

        extensions = set()
        for item in names("ignoredExtensions"):
            normalized = item.casefold()
            extensions.add(normalized if normalized.startswith(".") else f".{normalized}")
        return cls(
            ignored_directories=names("ignoredDirectories", DEFAULT_IGNORED_DIRECTORIES),
            ignored_files=names("ignoredFiles", DEFAULT_IGNORED_FILES),
            ignored_extensions=frozenset(extensions),
        )


@dataclass(frozen=True)
class BackupResult:
    status: str
    run_id: str
    current_path: str
    manifest_path: str
    copied_files: int
    deleted_files: int
    unchanged_files: int
    file_count: int
    requested_downloads: int
    resumed_files: int = 0

    def to_dict(self) -> dict:
        return asdict(self)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def unique_suffix() -> str:
    seed = f"{time.time_ns()}:{os.getpid()}:{id(object())}".encode()
    return hashlib.sha256(seed).hexdigest()[:12]


def sanitize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip()).strip(".-") or "source"


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(chunk_size)
            if not chunk:
                return digest.hexdigest()
            digest.update(chunk)


def _canonical(path: Path) -> Path:
    try:
        return path.expanduser().resolve(strict=True)
    except OSError as exc:
        raise SourceAccessError(f"Chemin inaccessible : {path}") from exc


def _inside(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_layout(sources: Iterable[Source], destination: Path):
    destination = destination.expanduser().resolve(strict=False)
    resolved = []
    source_ids = set()
    for source in sources:
        if source.source_id in source_ids:
            raise UnsafeLayoutError(f"Identifiant de source dupliqué : {source.source_id}")
        source_ids.add(source.source_id)
        path = _canonical(Path(source.path))
        if not path.is_dir():
            raise SourceAccessError(f"La source n'est pas un dossier : {source.label}")
        if _inside(destination, path) or _inside(path, destination):
            raise UnsafeLayoutError(f"La destination et la source se chevauchent : {source.label}")
        for previous, previous_path in resolved:
            if _inside(path, previous_path) or _inside(previous_path, path):
                raise UnsafeLayoutError(f"Les sources se chevauchent : {previous.label} / {source.label}")
        resolved.append((source, path))
    if not resolved:
        raise BackupError("Aucune source active")
    return tuple(resolved)


def iter_source_files(root: Path, filters: FilterRules | None = None):
    filters = filters or FilterRules()
    def failed(error):
        raise SourceAccessError(f"Lecture impossible : {error.filename or root}") from error
    for current, directories, filenames in os.walk(root, topdown=True, onerror=failed, followlinks=False):
        current = Path(current)
        directories[:] = sorted(n for n in directories if n not in filters.ignored_directories and not (current / n).is_symlink())
        for name in sorted(filenames):
            path = current / name
            if (
                name not in filters.ignored_files
                and path.suffix.casefold() not in filters.ignored_extensions
                and not path.is_symlink()
                and path.is_file()
            ):
                yield path, path.relative_to(root).as_posix()


def _load_manifest(path: Path) -> dict:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload if payload.get("schemaVersion") == SCHEMA_VERSION else {}
    except (OSError, json.JSONDecodeError, AttributeError):
        return {}


def _source_folders(resolved, previous: dict) -> dict[str, str]:
    prior = {s.get("sourceId"): s.get("folder") for s in previous.get("sources", [])}
    used = set()
    result = {}
    for source, _ in resolved:
        candidate = prior.get(source.source_id)
        if not candidate or candidate.casefold() in used:
            base = sanitize_name(source.label)
            candidate, index = base, 2
            while candidate.casefold() in used:
                candidate, index = f"{base}-{index}", index + 1
        used.add(candidate.casefold())
        result[source.source_id] = candidate
    return result


def _copy_and_hash(
    source: Path,
    target: Path,
    should_cancel: CancellationCheck | None = None,
) -> tuple[int, str]:
    target.parent.mkdir(parents=True, exist_ok=True)
    digest, size = hashlib.sha256(), 0
    try:
        with source.open("rb") as incoming, target.open("wb") as outgoing:
            while True:
                if should_cancel is not None and should_cancel():
                    raise BackupError("Temps d’arrière-plan expiré ; reprise au prochain lancement")
                chunk = incoming.read(1024 * 1024)
                if not chunk:
                    break
                outgoing.write(chunk); digest.update(chunk); size += len(chunk)
        shutil.copystat(source, target)
        return size, digest.hexdigest()
    except OSError as exc:
        target.unlink(missing_ok=True)
        raise SourceAccessError(f"Fichier iCloud indisponible : {source}") from exc


def _remove_empty(root: Path) -> None:
    if not root.exists():
        return
    for current, dirs, files in os.walk(root, topdown=False):
        path = Path(current)
        if path != root and not dirs and not files:
            try: path.rmdir()
            except OSError: pass


def _write_json(path: Path, payload: dict) -> None:
    temporary = path.with_suffix(".json.part")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(temporary, path)


def _resume_key(source_id: str, relative: str) -> str:
    return f"{source_id}:{relative}"


def _resume_cache_path(resume_root: Path, key: str) -> Path:
    """Return a stable path without trusting source-controlled path components."""
    return resume_root / "files" / hashlib.sha256(key.encode("utf-8")).hexdigest()


def _load_resume(resume_root: Path) -> dict:
    state = _load_manifest(resume_root / "STATE.json")
    return state if isinstance(state.get("files"), dict) else {"schemaVersion": SCHEMA_VERSION, "files": {}}


def _save_resume(resume_root: Path, state: dict) -> None:
    resume_root.mkdir(parents=True, exist_ok=True)
    _write_json(resume_root / "STATE.json", state)


def _discard_resume_entry(resume_root: Path, state: dict, key: str) -> None:
    entry = state["files"].pop(key, None)
    if entry:
        _resume_cache_path(resume_root, key).unlink(missing_ok=True)
        _save_resume(resume_root, state)


def _recover_transactions(destination: Path) -> None:
    """Rollback a publication interrupted by iOS terminating Pyto."""
    transaction_root = destination / "Transaction"
    if not transaction_root.exists():
        return
    for transaction in sorted(transaction_root.iterdir()):
        if not transaction.is_dir():
            continue
        journal_path = transaction / "JOURNAL.json"
        try:
            journal = json.loads(journal_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            shutil.rmtree(transaction, ignore_errors=True)
            continue
        if journal.get("state") != "applying":
            shutil.rmtree(transaction, ignore_errors=True)
            continue
        for relative in journal.get("created", []):
            target = destination / relative
            if target.is_file():
                target.unlink(missing_ok=True)
        rollback = transaction / "rollback"
        if rollback.exists():
            for backup in rollback.rglob("*"):
                if backup.is_file():
                    target = destination / backup.relative_to(rollback)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(backup, target)
        _remove_empty(destination / "Current")
        shutil.rmtree(transaction, ignore_errors=True)


def run_backup(
    sources: Iterable[Source],
    destination: str | Path,
    prepare_file: PrepareFile | None = None,
    progress: ProgressCallback | None = None,
    should_cancel: CancellationCheck | None = None,
    deep_verify: bool = False,
    filters: FilterRules | None = None,
) -> BackupResult:
    """Make ``Current`` an exact mirror. Deletions occur only after a full readable scan."""
    destination = Path(destination).expanduser()
    resolved = validate_layout(tuple(sources), destination)
    destination.mkdir(parents=True, exist_ok=True)
    _recover_transactions(destination)
    current = destination / "Current"
    current.mkdir(exist_ok=True)
    resume_root = destination / "Resume"
    resume = _load_resume(resume_root)
    # A process killed during a copy can leave bytes on disk, but the entry is
    # published only after the final rename. Unpublished partials are never used.
    if resume_root.exists():
        for partial in resume_root.rglob("*.part"):
            partial.unlink(missing_ok=True)
    previous = _load_manifest(current / "MANIFEST.json")
    previous_files = {f"{s['sourceId']}:{f['path']}": (s, f) for s in previous.get("sources", []) for f in s.get("files", [])}
    folders = _source_folders(resolved, previous)
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + unique_suffix()
    transaction = destination / "Transaction" / run_id
    staged, rollback = transaction / "staged", transaction / "rollback"
    staged.mkdir(parents=True)
    inventory, requested = [], 0
    def report(phase: str, completed: int = 0, total: int = 0, **details) -> None:
        if progress is not None:
            try:
                progress({"phase": phase, "completed": completed, "total": total, **details})
            except Exception:
                # A display failure must never invalidate a verified backup.
                pass

    def cancel_if_needed() -> None:
        if should_cancel is not None and should_cancel():
            raise BackupError("Temps d’arrière-plan expiré ; reprise au prochain lancement")

    try:
        # Phase 1: enumerate every source. An incomplete iCloud directory aborts here.
        scanned = []
        for source_index, (source, root) in enumerate(resolved, start=1):
            cancel_if_needed()
            report("scan", source_index - 1, len(resolved), label=source.label)
            files = list(iter_source_files(root, filters=filters))
            scanned.append((source, root, files))
            report("scan", source_index, len(resolved), label=source.label)

        total_files = sum(len(files) for _, _, files in scanned)
        # Phase 2: metadata is the fast path. Only candidates that need
        # reading ask iCloud to materialize their contents. deep_verify also
        # hashes the mirror and repairs silent corruption.
        prepared = 0

        # Read/hash only new or changed files into the transaction.
        copied = unchanged = resumed = 0
        processed = 0
        for source, root, files in scanned:
            records = []
            folder = folders[source.source_id]
            for path, relative in files:
                cancel_if_needed()
                try: stat = path.stat()
                except OSError as exc: raise SourceAccessError(f"Fichier iCloud indisponible : {path}") from exc
                key = f"{source.source_id}:{relative}"
                old = previous_files.get(key, ({}, {}))[1]
                mirror = current / folder / relative
                metadata_same = (
                    old.get("size") == stat.st_size
                    and old.get("mtimeNs") == stat.st_mtime_ns
                    and mirror.is_file()
                    and mirror.stat().st_size == stat.st_size
                    and bool(old.get("sha256"))
                )
                same = metadata_same
                if same and deep_verify:
                    same = sha256_file(mirror) == old["sha256"]
                if same:
                    digest = old["sha256"]; unchanged += 1
                else:
                    resume_key = _resume_key(source.source_id, relative)
                    cached = resume["files"].get(resume_key, {})
                    cache_path = _resume_cache_path(resume_root, resume_key)
                    resumable = (
                        cached.get("sourceId") == source.source_id
                        and cached.get("path") == relative
                        and cached.get("size") == stat.st_size
                        and cached.get("mtimeNs") == stat.st_mtime_ns
                        and bool(cached.get("sha256"))
                        and cache_path.is_file()
                        and cache_path.stat().st_size == stat.st_size
                    )
                    prepared += 1
                    report("prepare", prepared, 0, label=source.label, path=relative, resumed=resumable)
                    if resumable:
                        target = staged / folder / relative
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(cache_path, target)
                        size, digest = stat.st_size, cached["sha256"]
                        resumed += 1
                    else:
                        if cached:
                            _discard_resume_entry(resume_root, resume, resume_key)
                        if prepare_file is not None and prepare_file(path):
                            requested += 1
                        # iCloud may materialize or replace the file here.
                        try: stat = path.stat()
                        except OSError as exc: raise SourceAccessError(f"Fichier iCloud indisponible : {path}") from exc
                        cache_path.parent.mkdir(parents=True, exist_ok=True)
                        partial = cache_path.with_name(cache_path.name + ".part")
                        partial.unlink(missing_ok=True)
                        try:
                            size, digest = _copy_and_hash(path, partial, should_cancel=should_cancel)
                            if size != stat.st_size:
                                raise SourceAccessError(f"Fichier modifié pendant la lecture : {path}")
                            os.replace(partial, cache_path)
                        except Exception:
                            partial.unlink(missing_ok=True)
                            raise
                        resume["files"][resume_key] = {
                            "sourceId": source.source_id,
                            "path": relative,
                            "size": stat.st_size,
                            "mtimeNs": stat.st_mtime_ns,
                            "sha256": digest,
                        }
                        _save_resume(resume_root, resume)
                        target = staged / folder / relative
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(cache_path, target)
                    copied += 1
                records.append({"path": relative, "size": stat.st_size, "mtimeNs": stat.st_mtime_ns, "sha256": digest})
                processed += 1
                report("mirror", processed, total_files, label=source.label, path=relative, resumed=(not same and resumable))
            inventory.append({"sourceId": source.source_id, "label": source.label, "folder": folder, "fileCount": len(records), "files": records})

        desired = {f"{s['sourceId']}:{f['path']}" for s in inventory for f in s["files"]}
        obsolete = []
        for key, (old_source, old_file) in previous_files.items():
            if key not in desired:
                obsolete.append(current / old_source["folder"] / old_file["path"])
        # Remove legacy ZIP/bundle artifacts during the first schema-v2 publication.
        legacy = [p for p in current.iterdir() if p.is_file() and p.suffix.lower() == ".zip"]
        global_bundle = destination / "ProjectOS-Backup-Current.zip"
        if global_bundle.exists(): legacy.append(global_bundle)

        changed_targets = [(p, current / p.relative_to(staged)) for p in staged.rglob("*") if p.is_file()]
        report("publish", total_files, total_files, scope="local")
        manifest_path = current / "MANIFEST.json"
        affected = list(dict.fromkeys([target for _, target in changed_targets] + obsolete + legacy + [manifest_path]))
        created = []
        for target in affected:
            if target.exists():
                rel = target.relative_to(destination)
                backup = rollback / rel
                backup.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(target, backup)
            else:
                created.append(target)
        _write_json(
            transaction / "JOURNAL.json",
            {
                "state": "applying",
                "created": [str(path.relative_to(destination)) for path in created],
            },
        )
        try:
            for source_file, target in changed_targets:
                target.parent.mkdir(parents=True, exist_ok=True)
                temporary = target.with_name(target.name + ".part")
                shutil.copy2(source_file, temporary); os.replace(temporary, target)
            for target in obsolete + legacy:
                if target.is_dir(): shutil.rmtree(target)
                else: target.unlink(missing_ok=True)
            manifest = {"schemaVersion": SCHEMA_VERSION, "appVersion": APP_VERSION, "status": "complete", "runId": run_id, "createdAt": utc_now(), "sourceCount": len(inventory), "fileCount": sum(s["fileCount"] for s in inventory), "sources": inventory}
            _write_json(current / "MANIFEST.json", manifest)
        except Exception as exc:
            _recover_transactions(destination)
            raise BackupError(f"Publication annulée, sauvegarde précédente restaurée : {exc}") from exc
        _remove_empty(current)
        shutil.rmtree(transaction, ignore_errors=True)
        shutil.rmtree(resume_root, ignore_errors=True)
        report("complete", total_files, total_files, scope="local")
        return BackupResult("complete", run_id, str(current), str(current / "MANIFEST.json"), copied, len(obsolete), unchanged, sum(s["fileCount"] for s in inventory), requested, resumed)
    except Exception:
        shutil.rmtree(transaction, ignore_errors=True)
        raise
