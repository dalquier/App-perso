"""Adapter around Pyto bookmarks and best-effort iCloud downloads."""
from __future__ import annotations
from pathlib import Path
import hashlib
import os
import time

class PytoUnavailable(RuntimeError): pass

def _module():
    try: import file_system
    except ImportError as exc: raise PytoUnavailable("Cette action doit être exécutée dans Pyto") from exc
    return file_system

def _bookmark_exists(fs, name):
    stored = getattr(fs, "__stored_bookmarks__", None)
    if not callable(stored): return True
    try: return name in stored()
    except (KeyError, TypeError): return False

def choose_folder(prefix):
    fs = _module(); seed = f"{time.time_ns()}:{os.getpid()}:{prefix}".encode()
    name = f"projectos-backup-{prefix}-{hashlib.sha256(seed).hexdigest()[:24]}"
    try: bookmark = fs.FolderBookmark(name=name)
    except ValueError as exc: raise PytoUnavailable("Sélection annulée") from exc
    if not bookmark.path: raise PytoUnavailable("Aucun dossier sélectionné")
    return name, bookmark.path

def resolve_folder(name):
    fs = _module()
    if not _bookmark_exists(fs, name): raise PytoUnavailable("Autorisation de dossier absente ; ajoute à nouveau la source")
    bookmark = fs.FolderBookmark(name=name)
    if not bookmark.path or not Path(bookmark.path).is_dir(): raise PytoUnavailable("Accès au dossier expiré ou indisponible")
    return bookmark.path

def delete_bookmark(name):
    fs = _module()
    if not _bookmark_exists(fs, name): return
    try: fs.FolderBookmark(name=name).delete_from_disk()
    except (KeyError, ValueError): pass

def request_icloud_download(path: Path) -> bool:
    """Ask iOS to materialize an evicted iCloud item; actual reading remains the proof."""
    try:
        from Foundation import NSFileManager, NSURL
        manager = NSFileManager.defaultManager
        url = NSURL.fileURLWithPath_(str(path))
        method = getattr(manager, "startDownloadingUbiquitousItemAtURL_error_", None)
        if method is None: return False
        method(url, None)
        return True
    except Exception:
        return False
