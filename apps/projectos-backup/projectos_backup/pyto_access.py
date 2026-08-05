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
    bookmark = fs.FolderBookmark(name=bookmark_name)
    if not bookmark.path or not Path(bookmark.path).is_dir():
        raise PytoUnavailable("Accès au dossier expiré ou indisponible")
    return bookmark.path


def delete_bookmark(bookmark_name: str) -> None:
    fs = _module()
    try:
        fs.FolderBookmark(name=bookmark_name).delete_from_disk()
    except (KeyError, ValueError):
        pass
