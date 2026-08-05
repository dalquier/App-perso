"""Small adapter around Pyto security-scoped folder bookmarks."""

from __future__ import annotations

from pathlib import Path
import hashlib
import os
import time


class PytoUnavailable(RuntimeError):
    pass


def _module():
    try:
        import file_system
    except ImportError as exc:
        raise PytoUnavailable("Cette action doit être exécutée dans Pyto") from exc
    return file_system


def _bookmark_exists(fs, bookmark_name: str) -> bool:
    stored = getattr(fs, "__stored_bookmarks__", None)
    if not callable(stored):
        return True
    try:
        return bookmark_name in stored()
    except (KeyError, TypeError):
        return False


def choose_folder(prefix: str) -> tuple[str, str]:
    """Open Files once and persist access across launches."""
    fs = _module()
    seed = f"{time.time_ns()}:{os.getpid()}:{prefix}".encode("utf-8")
    bookmark_name = f"projectos-backup-{prefix}-{hashlib.sha256(seed).hexdigest()[:24]}"
    try:
        bookmark = fs.FolderBookmark(name=bookmark_name)
    except ValueError as exc:
        raise PytoUnavailable("Sélection annulée") from exc
    if not bookmark.path:
        raise PytoUnavailable("Aucun dossier sélectionné")
    return bookmark_name, bookmark.path


def resolve_folder(bookmark_name: str) -> str:
    fs = _module()
    if not _bookmark_exists(fs, bookmark_name):
        raise PytoUnavailable("Autorisation de dossier absente ; ajoute à nouveau la source")
    bookmark = fs.FolderBookmark(name=bookmark_name)
    if not bookmark.path or not Path(bookmark.path).is_dir():
        raise PytoUnavailable("Accès au dossier expiré ou indisponible")
    return bookmark.path


def delete_bookmark(bookmark_name: str) -> None:
    fs = _module()
    if not _bookmark_exists(fs, bookmark_name):
        return
    try:
        fs.FolderBookmark(name=bookmark_name).delete_from_disk()
    except (KeyError, ValueError):
        pass
