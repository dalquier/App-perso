"""Native PytoUI front-end for configuring and running backups."""

from __future__ import annotations

import json
import os
import threading
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

from .archive_sync import sync_conversation_buffer
from .conversation_buffer import buffer_root, import_inbox, initialize_buffer, queue_summary
from .core import BackupError, FilterRules, Source, run_backup
from .drive_client import AppsScriptClient, DriveSyncError, format_preflight_diagnostic, has_pending_drive_sync, preflight_drive, sync_current
from .pyto_access import BackgroundExecution, PytoUnavailable, choose_folder, delete_bookmark, request_icloud_download, resolve_folder
from .state import ConfigStore, DEFAULT_FILTERS, infer_source_label


PROGRESS_THROTTLE_SECONDS = 0.12
DETERMINATE_PHASES = {"archive_queue", "archive_prepare", "archive_upload", "scan", "prepare", "mirror", "upload_prepare", "upload", "delete", "complete"}
RESULT_FILE = "last_ui_result.json"
LOCAL_PHASES = {"scan", "prepare", "mirror"}
DRIVE_PHASES = {
    "archive_queue", "archive_prepare", "archive_upload", "archive_verify",
    "drive_prepare", "drive_wake", "drive_auth", "drive_manifest", "drive_retry", "drive_ready",
    "upload_prepare", "upload", "delete", "publish", "complete",
}
DRIVE_PREFLIGHT_PHASES = {"drive_wake", "drive_auth", "drive_manifest", "drive_retry", "drive_ready"}
ARCHIVE_PHASES = {"archive_queue", "archive_prepare", "archive_upload", "archive_verify"}


def _ui():
    try:
        import pyto_ui as ui
    except ImportError as exc:
        raise PytoUnavailable("L'interface doit être lancée dans Pyto") from exc
    return ui


def progress_ratio(completed: int, total: int) -> float:
    """Return a progress ratio clamped to the interval 0..1."""
    if total <= 0:
        return 0.0
    return min(1.0, max(0.0, completed / total))


def progress_percent(completed: int, total: int) -> int:
    return int(progress_ratio(completed, total) * 100)


def overall_progress(event: dict, standalone_drive: bool = False) -> float:
    """Map each phase onto one end-to-end scale instead of resetting the bar."""
    phase = event.get("phase")
    ratio = progress_ratio(event.get("completed", 0), event.get("total", 0))
    if event.get("scope") == "local" and phase in {"publish", "complete"}:
        return 0.56 if phase == "publish" else 0.58
    if standalone_drive:
        return {
            "drive_wake": 0.18, "drive_auth": 0.45, "drive_manifest": 0.72,
            "drive_retry": 0.12, "drive_ready": 1.0,
        }.get(phase, ratio)
    if phase == "archive_queue": return 0.59 + 0.01 * ratio
    if phase == "archive_prepare": return 0.60 + 0.02 * ratio
    if phase == "archive_upload": return 0.62 + 0.05 * ratio
    if phase == "archive_verify": return 0.68
    if phase == "scan": return 0.10 * ratio
    if phase == "prepare": return 0.10
    if phase == "mirror": return 0.10 + 0.48 * ratio
    if phase in {"drive_prepare", "drive_wake"}: return 0.69
    if phase == "drive_auth": return 0.71
    if phase in {"drive_manifest", "drive_retry"}: return 0.73
    if phase == "drive_ready": return 0.75
    if phase == "upload_prepare": return 0.75 + 0.05 * ratio
    if phase in {"upload", "delete"}: return 0.80 + 0.17 * ratio
    if phase == "publish": return 0.98
    if phase == "complete": return 1.0
    return 0.0


def parse_filter_text(value: str, extensions: bool = False) -> list[str]:
    """Parse comma/newline separated exclusions entered on iPhone."""
    result = []
    for part in value.replace("\n", ",").split(","):
        item = part.strip()
        if not item:
            continue
        if extensions and not item.startswith("."):
            item = f".{item}"
        item = item.casefold() if extensions else item
        if item.casefold() not in {entry.casefold() for entry in result}:
            result.append(item)
    return result


def filter_summary(filters: dict) -> str:
    directories = len(filters.get("ignoredDirectories", []))
    files = len(filters.get("ignoredFiles", []))
    extensions = len(filters.get("ignoredExtensions", []))
    suffix = f" · {extensions} extension{'s' if extensions != 1 else ''}" if extensions else " · toutes extensions incluses"
    return f"{directories} dossiers · {files} fichiers{suffix}"


def compact_filter_summary(filters: dict) -> str:
    return (
        f"{len(filters.get('ignoredDirectories', []))} dossiers · "
        f"{len(filters.get('ignoredFiles', []))} fichiers · "
        f"{len(filters.get('ignoredExtensions', []))} extensions"
    )


def should_emit_progress(previous: dict | None, event: dict, now: float, interval: float = PROGRESS_THROTTLE_SECONDS) -> bool:
    """Throttle cosmetic updates while always showing phase changes and completion."""
    if previous is None:
        return True
    if event.get("phase") != previous.get("phase"):
        return True
    if event.get("total", 0) and event.get("completed", 0) >= event.get("total", 0):
        return True
    if progress_percent(event.get("completed", 0), event.get("total", 0)) != previous.get("percent"):
        return True
    return now - previous.get("time", 0.0) >= interval


def progress_copy(event: dict) -> tuple[str, str, str, float]:
    """Build the user-facing phase, counter, file name and ratio."""
    phase = event.get("phase")
    completed = event.get("completed", 0)
    total = event.get("total", 0)
    label = event.get("label", "")
    path = event.get("path", "")
    titles = {
        "scan": f"Analyse de {label}" if label else "Analyse des sources",
        "archive_queue": "Archives de conversations en attente",
        "archive_prepare": "Préparation des archives",
        "archive_upload": "Envoi des archives vers Drive",
        "archive_verify": "Vérification des archives",
        "prepare": "Préparation iCloud",
        "mirror": "Mise à jour du miroir local",
        "drive_prepare": "Connexion à Google Drive",
        "drive_wake": "Réveil du service Google",
        "drive_auth": "Vérification de l’accès sécurisé",
        "drive_manifest": "Lecture de l’index Drive",
        "drive_retry": "Nouvelle tentative de connexion",
        "drive_ready": "Google Drive prêt",
        "upload_prepare": "Préparation des envois",
        "upload": "Envoi vers Google Drive",
        "delete": "Nettoyage du miroir Drive",
        "publish": "Publication du manifeste",
        "complete": "Vérification finale",
    }
    title = titles.get(phase, "Sauvegarde en cours")
    if event.get("scope") == "local" and phase == "publish":
        title = "Sécurisation du miroir local"
    elif event.get("scope") == "local" and phase == "complete":
        title = "Miroir local prêt"
    ratio = progress_ratio(completed, total) if phase in DETERMINATE_PHASES else 0.0
    if event.get("maxAttempts"):
        counter = f"Tentative {event.get('attempt', 1)} / {event['maxAttempts']}"
    else:
        counter = f"{completed} / {total}   ·   {progress_percent(completed, total)} % de cette étape" if total else "Préparation en cours"
    message = event.get("message", "")
    filename = message[:100] if message else (Path(path).name[:60] if path else "Les fichiers restent disponibles pendant l'opération.")
    return title, counter, filename, ratio


def progress_color(event: dict) -> str:
    phase = event.get("phase")
    if phase in ARCHIVE_PHASES:
        return "SYSTEM_PURPLE"
    if phase in {"complete", "publish"}:
        return "SYSTEM_GREEN"
    if phase in DRIVE_PHASES:
        return "SYSTEM_TEAL"
    return "SYSTEM_BLUE"


def progress_stages(event: dict) -> tuple[str, str]:
    """Return concise local and Drive states for a progress event."""
    phase = event.get("phase")
    if event.get("scope") == "local" and phase in {"publish", "complete"}:
        return "Terminé", "En attente"
    if phase in LOCAL_PHASES:
        return "En cours", "En attente"
    if phase in ARCHIVE_PHASES:
        return ("Terminé" if event.get("localComplete") else "En attente"), "Archives"
    if phase in DRIVE_PREFLIGHT_PHASES:
        return ("Terminé" if event.get("localComplete") else "En attente"), "Connexion"
    if phase in DRIVE_PHASES:
        return "Terminé", "En cours"
    return "En attente", "En attente"


def responsive_layout(width: float, height: float) -> dict[str, tuple[int, int, int, int]]:
    """Return non-overlapping frames for the scrollable source area and fixed action card."""
    page_width = max(320, int(width))
    page_height = max(600, int(height))
    margin = 16
    table_top = 308
    action_height = 82
    action_y = page_height - action_height - margin
    table_height = max(96, action_y - table_top - 10)
    return {
        "table": (0, table_top, page_width, table_height),
        "actions": (margin, action_y, page_width - 2 * margin, action_height),
    }


FILTER_SECTIONS = (
    ("ignoredDirectories", "📁", "Dossiers", "Ex. .git ou __pycache__"),
    ("ignoredFiles", "📄", "Fichiers", "Ex. .DS_Store"),
    ("ignoredExtensions", "🏷", "Extensions", "Ex. log ou .tmp"),
)


def normalize_filter_item(value: str, key: str) -> str:
    """Normalize one exclusion entered on iPhone without comma editing."""
    item = str(value).strip().strip(",")
    if not item:
        return ""
    if key == "ignoredExtensions":
        item = item.casefold()
        if not item.startswith("."):
            item = f".{item}"
    return item


def filter_editor_rows(filters: dict, key: str) -> list[str]:
    """Return stable, de-duplicated rows for the list editor."""
    result = []
    for raw in filters.get(key, []):
        item = normalize_filter_item(raw, key)
        if item and item.casefold() not in {entry.casefold() for entry in result}:
            result.append(item)
    return sorted(result, key=str.casefold)


def backup_summary(local, drive: dict, local_seconds: float = 0.0, drive_seconds: float = 0.0, archives=None) -> dict:
    """Build the serialisable, user-facing summary kept across launches."""
    return {
        "status": "complete",
        "finishedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "local": {
            "copied": int(getattr(local, "copied_files", 0)),
            "resumed": int(getattr(local, "resumed_files", 0)),
            "deleted": int(getattr(local, "deleted_files", 0)),
            "unchanged": int(getattr(local, "unchanged_files", 0)),
            "durationSeconds": round(max(0.0, local_seconds), 1),
        },
        "drive": {
            "uploaded": int(drive.get("uploaded_files", 0)),
            "deleted": int(drive.get("deleted_files", 0)),
            "verified": int(drive.get("verified_files", 0)),
            "resumed": int(drive.get("resumed_files", 0)),
            "unchanged": int(drive.get("unchanged_files", 0)),
            "durationSeconds": round(max(0.0, drive_seconds), 1),
        },
        "archives": archives or {"verified": 0, "pending": 0, "uploaded": 0, "resumed": 0, "errors": []},
    }


def summary_copy(summary: dict) -> tuple[str, str]:
    """Format a persisted result without assuming every future field exists."""
    local = summary.get("local", {})
    drive = summary.get("drive", {})
    local_line = (
        f"Local  ·  {local.get('copied', 0)} copiés  ·  "
        f"{local.get('resumed', 0)} repris  ·  {local.get('unchanged', 0)} inchangés  ·  "
        f"{local.get('deleted', 0)} supprimés"
    )
    drive_line = (
        f"Drive  ·  {drive.get('uploaded', 0)} envoyés  ·  "
        f"{drive.get('resumed', 0)} repris  ·  {drive.get('deleted', 0)} supprimés  ·  "
        f"{drive.get('verified', 0)} vérifiés"
    )
    archives = summary.get("archives", {})
    if archives.get("verified") or archives.get("pending"):
        drive_line += f"  ·  Archives {archives.get('verified', 0)} vérifiées / {archives.get('pending', 0)} en attente"
    return local_line, drive_line


def compact_summary_copy(summary: dict) -> tuple[str, str, str]:
    """Three short lines sized for the iPhone status cards."""
    local, drive, archives = summary.get("local", {}), summary.get("drive", {}), summary.get("archives", {})
    headline = f"✓ {drive.get('verified', 0)} fichiers vérifiés sur Google Drive"
    drive_line = (
        f"☁️ {drive.get('uploaded', 0)} envoyés · {drive.get('unchanged', 0)} inchangés"
        f" · {drive.get('resumed', 0)} repris"
    )
    local_line = f"📱 {local.get('copied', 0)} copiés · {local.get('deleted', 0)} supprimés"
    if archives.get("pending"):
        local_line += f" · 💬 {archives.get('pending', 0)} archive(s) en attente"
    return headline, drive_line, local_line


def error_copy(exc: Exception) -> tuple[str, str]:
    """Return a readable headline plus a complete diagnostic."""
    headline = str(exc).strip() or exc.__class__.__name__
    detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)).strip()
    return headline, detail


def save_result(path: Path, payload: dict) -> None:
    """Atomically persist the latest UI outcome."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".part")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temporary, path)


def load_result(path: Path) -> dict | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _set_button_appearance(button, background, foreground, radius=11) -> None:
    """Apply legible button colors across PytoUI versions."""
    button.background_color = background
    for attribute in ("title_color", "tint_color"):
        try:
            setattr(button, attribute, foreground)
        except (AttributeError, TypeError):
            pass
    try:
        button.corner_radius = radius
    except (AttributeError, TypeError):
        pass


def _solid_white(ui):
    try:
        return ui.Color.white()
    except (AttributeError, TypeError):
        try:
            return ui.Color(1, 1, 1, 1)
        except (AttributeError, TypeError):
            return ui.SystemColors.SYSTEM_BACKGROUND


class FilterSettingsController:
    """Retained list editor; bound callbacks remain alive while the sheet is open."""

    def __init__(self, app, parent=None):
        self.app, self.ui = app, app.ui
        self.parent = parent
        self.values = {key: filter_editor_rows(app.store.filters(), key) for key, *_ in FILTER_SECTIONS}
        self.key = "ignoredDirectories"
        self.view = self.ui.View()
        self.view.title = "Exclusions"
        self.view.size = self.app.root.size
        self.view.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.view.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND

        title = self.ui.Label("Exclusions de sauvegarde")
        title.frame = (18, 14, 250, 30)
        intro = self.ui.Label("Chaque règle est indépendante. Balayez une ligne pour la supprimer.")
        intro.frame = (18, 46, 354, 42)
        intro.number_of_lines = 2
        self.view.add_subview(title); self.view.add_subview(intro)

        self.mode_buttons = []
        actions = (self._show_directories, self._show_files, self._show_extensions)
        for index, ((_, icon, label, _), action) in enumerate(zip(FILTER_SECTIONS, actions)):
            button = self.ui.Button(title=f"{icon} {'Types' if label == 'Extensions' else label}")
            button.frame = (18 + index * 119, 94, 112, 38)
            button.action = action
            self.view.add_subview(button)
            self.mode_buttons.append(button)

        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = (0, 140, 390, 260)
        self.table.did_delete_cell = self._delete
        self.view.add_subview(self.table)

        self.input = self.ui.TextField()
        self.input.frame = (18, 408, 254, 42)
        self.add_button = self.ui.Button(title="＋ Ajouter")
        self.add_button.frame = (280, 408, 92, 42)
        self.add_button.action = self._add
        self.reset_button = self.ui.Button(title="↺ Valeurs recommandées")
        self.reset_button.frame = (18, 460, 190, 38)
        self.reset_button.action = self._reset
        self.cancel_button = self.ui.Button(title="Annuler")
        self.cancel_button.frame = (18, 524, 110, 48)
        self.cancel_button.action = self._cancel
        self.save_button = self.ui.Button(title="Enregistrer")
        self.save_button.frame = (214, 524, 158, 48)
        self.save_button.action = self._save
        for item in (self.input, self.add_button, self.reset_button, self.cancel_button, self.save_button):
            self.view.add_subview(item)
        self._style(); self._refresh()

    def _style(self):
        blue = self.app._color("SYSTEM_BLUE", "LABEL")
        white = _solid_white(self.ui)
        secondary = self.app._color("TERTIARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND")
        for button in self.mode_buttons + [self.add_button, self.reset_button, self.cancel_button]:
            _set_button_appearance(button, secondary, blue)
        _set_button_appearance(self.save_button, blue, white, radius=13)

    def _set_mode(self, key: str):
        self.key = key
        self.input.text = ""
        self._refresh()

    def _show_directories(self, sender=None): self._set_mode("ignoredDirectories")
    def _show_files(self, sender=None): self._set_mode("ignoredFiles")
    def _show_extensions(self, sender=None): self._set_mode("ignoredExtensions")

    def _refresh(self):
        selected = self.app._color("SYSTEM_BLUE", "LABEL")
        selected_text = _solid_white(self.ui)
        normal = self.app._color("TERTIARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND")
        for button, (key, *_rest) in zip(self.mode_buttons, FILTER_SECTIONS):
            _set_button_appearance(button, selected if key == self.key else normal, selected_text if key == self.key else selected)
        section = next(item for item in FILTER_SECTIONS if item[0] == self.key)
        self.input.placeholder = section[3]
        cells = []
        for value in self.values[self.key]:
            cell = self.ui.TableViewCell(text=f"{section[1]}  {value}")
            cell.detail_text_label.text = "Balayez vers la gauche pour supprimer"
            cell.removable = True
            cells.append(cell)
        if not cells:
            cell = self.ui.TableViewCell(text="Aucune exclusion")
            cell.detail_text_label.text = "Tous les éléments de cette catégorie sont sauvegardés"
            cells.append(cell)
        self.table.set_cells(cells)

    def _add(self, sender=None):
        item = normalize_filter_item(self.input.text or "", self.key)
        if not item:
            return
        if item.casefold() not in {value.casefold() for value in self.values[self.key]}:
            self.values[self.key].append(item)
            self.values[self.key].sort(key=str.casefold)
        self.input.text = ""
        self._refresh()

    def _delete(self, section, index: int):
        if 0 <= index < len(self.values[self.key]):
            self.values[self.key].pop(index)
            self._refresh()

    def _reset(self, sender=None):
        self.values = {key: list(DEFAULT_FILTERS[key]) for key, *_ in FILTER_SECTIONS}
        self._refresh()

    def _cancel(self, sender=None):
        self.view.hidden = True
        if self.parent:
            self.parent.view.hidden = False
        self.app._filter_controller = None

    def _save(self, sender=None):
        self.app.store.set_filters(
            self.values["ignoredDirectories"], self.values["ignoredFiles"], self.values["ignoredExtensions"],
        )
        self.app.message_label.text = "Exclusions enregistrées pour la prochaine sauvegarde."
        self.app.refresh()
        if self.app._settings_controller:
            self.app._settings_controller.refresh()
        self.view.hidden = True
        if self.parent:
            self.parent.refresh()
            self.parent.view.hidden = False
        self.app._filter_controller = None

    def show(self):
        self.app.root.add_subview(self.view)
        self.view.hidden = False


class SourceSettingsController:
    """Source list kept inside the app so Pyto never has to dismiss a sheet."""

    def __init__(self, app, parent):
        self.app, self.ui, self.parent = app, app.ui, parent
        self.view = self.ui.View()
        self.view.size = self.app.root.size
        self.view.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.view.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND
        title = self.ui.Label("📂  Dossiers sources")
        title.frame = (18, 14, 250, 34)
        back = self.ui.Button(title="Retour")
        back.frame = (276, 12, 96, 38)
        back.action = self._back
        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = (0, 62, 390, 590)
        self.table.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.table.did_select_cell = self._selected
        self.table.did_delete_cell = self._deleted
        add = self.ui.Button(title="＋ Ajouter un dossier")
        add.frame = (18, 672, 354, 48)
        add.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        add.action = self._add
        for item in (title, back, self.table, add):
            self.view.add_subview(item)
        blue, white = self.app._color("SYSTEM_BLUE", "LABEL"), _solid_white(self.ui)
        _set_button_appearance(back, self.app._color("TERTIARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND"), blue)
        _set_button_appearance(add, blue, white, radius=13)
        self.refresh()

    def refresh(self):
        self.sources = self.app._sources_with_repaired_labels()
        cells = []
        for source in self.sources:
            cell = self.ui.TableViewCell(text=f"📁  {source.label}")
            cell.detail_text_label.text = "Actif · toucher pour suspendre" if source.enabled else "Suspendu · toucher pour activer"
            cell.accessory_type = self.ui.AccessoryType.CHECKMARK if source.enabled else self.ui.AccessoryType.NONE
            cell.removable = True
            cells.append(cell)
        if not cells:
            cell = self.ui.TableViewCell(text="Aucun dossier")
            cell.detail_text_label.text = "Utilisez Ajouter un dossier"
            cells.append(cell)
        self.table.set_cells(cells)

    def _selected(self, section, index):
        section.table_view.deselect_row()
        if index < len(self.sources):
            self.app.store.toggle_source(self.sources[index].source_id)
            self.refresh(); self.app.refresh(); self.parent.refresh()

    def _deleted(self, section, index):
        if index < len(self.sources):
            removed = self.app.store.remove_source(self.sources[index].source_id)
            delete_bookmark(removed.bookmark_name)
            self.refresh(); self.app.refresh(); self.parent.refresh()

    def _add(self, sender=None):
        self.app._add_source()
        self.refresh(); self.parent.refresh()

    def _back(self, sender=None):
        self.view.hidden = True
        self.parent.refresh()
        self.parent.view.hidden = False

    def show(self):
        self.app.root.add_subview(self.view)
        self.view.hidden = False


class SettingsController:
    """Dedicated compact settings sheet for storage, sources, filters and Drive."""

    def __init__(self, app):
        self.app, self.ui = app, app.ui
        self.view = self.ui.View()
        self.view.title = "Paramètres"
        self.view.size = self.app.root.size
        self.view.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.view.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND
        title = self.ui.Label("⚙️  Paramètres")
        title.frame = (18, 14, 250, 34)
        self.done = self.ui.Button(title="Terminé")
        self.done.frame = (276, 12, 96, 38)
        self.done.action = self._close
        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = (0, 62, 390, 430)
        self.table.did_select_cell = self._selected
        self.add = self.ui.Button(title="＋ Ajouter un dossier source")
        self.add.frame = (18, 510, 354, 46)
        self.add.action = self._add_source
        self.view.add_subview(title); self.view.add_subview(self.done)
        self.view.add_subview(self.table); self.view.add_subview(self.add)
        blue = self.app._color("SYSTEM_BLUE", "LABEL")
        white = _solid_white(self.ui)
        secondary = self.app._color("TERTIARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND")
        _set_button_appearance(self.done, blue, white)
        _set_button_appearance(self.add, secondary, blue)
        self.refresh()

    def refresh(self):
        config = self.app.store.load()
        destination = "À choisir"
        if config.get("destinationBookmark"):
            try: destination = Path(resolve_folder(config["destinationBookmark"])).name or "Configuré"
            except PytoUnavailable: destination = "Accès à renouveler"
        source_count = len(config.get("sources", []))
        enabled_count = sum(1 for source in config.get("sources", []) if source.get("enabled", True))
        filters = compact_filter_summary(config.get("filters", {}))
        archive_text = "Destination requise"
        if config.get("destinationBookmark"):
            try:
                summary = queue_summary(initialize_buffer(buffer_root(resolve_folder(config["destinationBookmark"]))))
                archive_text = f"{summary['pendingTotal']} en attente · {summary['Verified']} vérifiées"
            except (OSError, PytoUnavailable): archive_text = "État indisponible"
        rows = (
            ("📍  Miroir local", destination),
            ("📂  Dossiers sources", f"{enabled_count} actifs sur {source_count}"),
            ("🚫  Exclusions", filters),
            ("☁️  Google Drive", "Tester la connexion et l’accès"),
            ("💬  Archives Codex", archive_text),
        )
        cells = []
        for title, detail in rows:
            cell = self.ui.TableViewCell(text=title)
            cell.detail_text_label.text = detail
            cell.accessory_type = self.ui.AccessoryType.DISCLOSURE_INDICATOR
            cells.append(cell)
        self.table.set_cells(cells)

    def _selected(self, section, index: int):
        section.table_view.deselect_row()
        if index == 0:
            self.view.hidden = True; self.app._choose_destination(); self.view.hidden = False; self.refresh()
        elif index == 1:
            self.view.hidden = True
            self.app._source_controller = SourceSettingsController(self.app, self)
            self.app._source_controller.show()
        elif index == 2:
            self.view.hidden = True; self.app._show_filter_settings(parent=self)
        elif index == 3:
            self.view.hidden = True; self.app._test_drive()
        elif index == 4:
            self.app.alert("Archives Codex", "Les archives non confirmées restent dans iCloud. Après vérification Drive, elles sont conservées 30 jours.")

    def _add_source(self, sender=None):
        self.app._add_source(); self.refresh()

    def _close(self, sender=None):
        self.view.hidden = True
        self.app._settings_controller = None

    def show(self):
        self.app.root.add_subview(self.view)
        self.view.hidden = False


class BackupApplication:
    def __init__(self):
        self.ui = _ui()
        self.store = ConfigStore()
        self._running = False
        self._last_progress = None
        self._overall_progress = 0.0
        self._operation = None
        self._cancel_requested = threading.Event()
        self._last_error_detail = ""
        self._navigation = None
        self._settings_controller = None
        self._filter_controller = None
        self._source_controller = None
        self._result_path = self.store.directory / RESULT_FILE

        self.root = self.ui.View()
        self.root.title = "ProjectOS Backup"
        self.root.size = (390, 820)
        self.root.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND
        layout = responsive_layout(*self.root.size)

        self.header = self.ui.View()
        self.header.frame = (16, 12, 358, 82)
        self.header.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.state_label = self.ui.Label("ProjectOS Backup")
        self.state_label.frame = (16, 9, 205, 25)
        self.state_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.message_label = self.ui.Label("Configurez vos sources puis lancez la mise à jour.")
        self.message_label.frame = (16, 36, 326, 40)
        self.message_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.message_label.number_of_lines = 3
        self.settings_button = self.ui.Button(title="⚙️")
        self.settings_button.frame = (224, 6, 40, 34)
        self.settings_button.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN]
        self.settings_button.action = self._show_settings
        self.close_button = self.ui.Button(title="Fermer")
        self.close_button.frame = (270, 6, 76, 34)
        self.close_button.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN]
        self.close_button.action = self._close
        self.header.add_subview(self.state_label)
        self.header.add_subview(self.message_label)
        self.header.add_subview(self.settings_button)
        self.header.add_subview(self.close_button)
        self.status = self.message_label

        self.progress_card = self.ui.View()
        self.progress_card.frame = (16, 104, 358, 194)
        self.progress_card.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.phase_label = self.ui.Label("Sauvegarde prête")
        self.phase_label.frame = (16, 12, 326, 28)
        self.phase_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.counter_label = self.ui.Label("Aucune opération en cours")
        self.counter_label.frame = (16, 42, 326, 24)
        self.counter_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.progress_track = self.ui.View()
        self.progress_track.frame = (16, 74, 326, 12)
        self.progress_track.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.progress_fill = self.ui.View()
        self.progress_fill.frame = (0, 0, 0, 12)
        self.progress_track.add_subview(self.progress_fill)
        self.file_label = self.ui.Label("Local → Google Drive · miroir vérifié")
        self.local_stage = self.ui.Label("📱 Local · En attente")
        self.local_stage.frame = (16, 96, 157, 24)
        self.local_stage.flex = [self.ui.AutoResizing.FLEXIBLE_RIGHT_MARGIN]
        self.drive_stage = self.ui.Label("☁️ Drive · En attente")
        self.drive_stage.frame = (181, 96, 161, 24)
        self.drive_stage.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN]
        self.file_label.frame = (16, 128, 326, 50)
        self.file_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.file_label.number_of_lines = 2
        for view in (self.phase_label, self.counter_label, self.progress_track, self.local_stage, self.drive_stage, self.file_label):
            self.progress_card.add_subview(view)

        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = layout["table"]
        self.table.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.table.did_select_cell = self._selected
        self.table.did_delete_cell = self._deleted

        self.action_bar = self.ui.View()
        self.action_bar.frame = layout["actions"]
        self.action_bar.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]

        self.add_source_button = self.ui.Button(title="＋")
        self.add_source_button.frame = (12, 12, 52, 56)
        self.add_source_button.action = self._add_source

        self.backup_button = self.ui.Button(title="Mettre à jour la sauvegarde")
        self.backup_button.frame = (72, 12, 274, 56)
        self.backup_button.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.backup_button.action = self._backup

        self.detail_button = self.ui.Button(title="Diagnostic")
        self.detail_button.frame = (240, 12, 106, 56)
        self.detail_button.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN]
        self.detail_button.action = self._show_error_detail
        self.detail_button.hidden = True

        for view in (self.add_source_button, self.detail_button, self.backup_button):
            self.action_bar.add_subview(view)

        for view in (self.header, self.progress_card, self.table, self.action_bar):
            self.root.add_subview(view)
        self._apply_colors()
        self.refresh()
        self._restore_last_result()

    def _color(self, name: str, fallback: str):
        return getattr(self.ui.SystemColors, name, getattr(self.ui.SystemColors, fallback))

    def _apply_colors(self) -> None:
        card = self._color("SECONDARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND")
        self.header.background_color = card
        self.progress_card.background_color = card
        self.action_bar.background_color = card
        self.progress_track.background_color = self._color("SYSTEM_GRAY_5", "SYSTEM_BACKGROUND")
        self.progress_fill.background_color = self._color("SYSTEM_BLUE", "SYSTEM_BACKGROUND")
        self.state_label.text_color = self._color("SYSTEM_BLUE", "LABEL")
        self.file_label.text_color = self._color("SECONDARY_LABEL", "LABEL")
        self.counter_label.text_color = self._color("SECONDARY_LABEL", "LABEL")
        for view, radius in (
            (self.header, 16), (self.progress_card, 18), (self.action_bar, 18),
            (self.progress_track, 6), (self.progress_fill, 6),
        ):
            try:
                view.corner_radius = radius
            except (AttributeError, TypeError):
                pass
        blue = self._color("SYSTEM_BLUE", "LABEL")
        white = _solid_white(self.ui)
        secondary = self._color("TERTIARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND")
        _set_button_appearance(self.settings_button, secondary, blue)
        _set_button_appearance(self.close_button, secondary, blue)
        _set_button_appearance(self.detail_button, secondary, blue)
        _set_button_appearance(self.add_source_button, secondary, blue)
        _set_button_appearance(self.backup_button, blue, white, radius=14)

    def alert(self, title: str, message: str) -> str:
        alert = self.ui.Alert(title, message)
        alert.add_action("OK")
        return alert.show()

    def _close(self, sender=None) -> None:
        target = self._navigation or self.root
        close = getattr(target, "close", None)
        if callable(close):
            close()

    def _show_error_detail(self, sender=None) -> None:
        if not self._last_error_detail:
            return
        dialog = self.ui.Alert("Diagnostic technique", self._last_error_detail)
        dialog.add_action("Fermer")
        dialog.add_action("Copier")
        if dialog.show() in ("Copier", 1):
            try:
                import pasteboard
                pasteboard.set_string(self._last_error_detail)
                self.message_label.text = "Diagnostic copié. Vous pouvez maintenant me l’envoyer."
            except Exception:
                self.alert("Copie indisponible", "Sélectionnez le texte du diagnostic manuellement.")

    def _set_controls_enabled(self, enabled: bool) -> None:
        # Keep the primary action legible while running; _running is the
        # authoritative double-tap guard and the title explains the state.
        self.backup_button.enabled = True
        self.settings_button.enabled = enabled
        self.add_source_button.enabled = enabled

    def _set_state_color(self, state: str) -> None:
        name = {
            "success": "SYSTEM_GREEN", "warning": "SYSTEM_ORANGE",
            "error": "SYSTEM_RED", "active": "SYSTEM_BLUE",
        }.get(state, "SYSTEM_BLUE")
        self.state_label.text_color = self._color(name, "LABEL")

    def _set_diagnostic_visible(self, visible: bool) -> None:
        self.detail_button.hidden = not visible
        self.add_source_button.hidden = visible or self._running
        if visible:
            self.backup_button.frame = (12, 12, 220, 56)
        elif self._running:
            self.backup_button.frame = (12, 12, 334, 56)
        else:
            self.backup_button.frame = (72, 12, 274, 56)

    def _show_settings(self, sender=None) -> None:
        if self._running:
            return
        self._settings_controller = SettingsController(self)
        self._settings_controller.show()

    def _show_filter_settings(self, sender=None, parent=None) -> None:
        if self._running:
            return
        self._filter_controller = FilterSettingsController(self, parent=parent)
        self._filter_controller.show()

    def _restore_last_result(self) -> None:
        result = load_result(self._result_path)
        if not result:
            return
        if result.get("status") == "complete":
            headline, drive_line, local_line = compact_summary_copy(result)
            self.state_label.text = "À JOUR"
            self._set_state_color("success")
            self.message_label.text = headline
            self.phase_label.text = "Tout est à jour"
            self.counter_label.text = drive_line
            self.file_label.text = local_line
            self.local_stage.text = "📱 Local · Terminé"
            self.drive_stage.text = "☁️ Drive · Vérifié"
            self._set_progress_fill(1.0)
        elif result.get("status") == "interrupted":
            self.state_label.text = "REPRISE DISPONIBLE"
            self._set_state_color("warning")
            self.message_label.text = result.get("message", "Une opération reste à reprendre.")
            self.phase_label.text = "Sauvegarde interrompue"
            local_complete = bool(result.get("localComplete"))
            self.counter_label.text = "Le miroir local valide est conservé" if local_complete else "Le miroir local devra reprendre"
            self.file_label.text = "Relancez pour reprendre les éléments non confirmés."
            self.local_stage.text = f"📱 Local · {'Terminé' if local_complete else 'À reprendre'}"
            self.drive_stage.text = "☁️ Drive · À reprendre"
            self._last_error_detail = result.get("detail", "")
            self._set_diagnostic_visible(bool(self._last_error_detail))

    def _sources_with_repaired_labels(self):
        config = self.store.load()
        suggestions = config.get("suggestedLabels", [])
        sources = self.store.sources()
        repaired = []
        for source in sources:
            if source.label.casefold() == "documents":
                try:
                    label = infer_source_label(resolve_folder(source.bookmark_name), suggestions)
                except PytoUnavailable:
                    label = source.label
                if label != source.label:
                    source = self.store.rename_source(source.source_id, label)
            repaired.append(source)
        return repaired

    def refresh(self) -> None:
        cells = []
        self._visible_sources = self._sources_with_repaired_labels()
        for source in self._visible_sources:
            cell = self.ui.TableViewCell(text=f"📂  {source.label}")
            cell.detail_text_label.text = "Sauvegardé · toucher pour suspendre" if source.enabled else "Suspendu · toucher pour réactiver"
            cell.accessory_type = self.ui.AccessoryType.CHECKMARK if source.enabled else self.ui.AccessoryType.NONE
            cell.removable = not self._running
            cells.append(cell)
        if not cells:
            cell = self.ui.TableViewCell(text="Aucun dossier source")
            cell.detail_text_label.text = "Ajoutez-en un depuis ⚙️ Paramètres"
            cells.append(cell)
        self.table.set_cells(cells)

    def _selected(self, section, index: int) -> None:
        section.table_view.deselect_row()
        if self._running:
            return
        if not self._visible_sources or index >= len(self._visible_sources):
            return
        source = self._visible_sources[index]
        self.store.toggle_source(source.source_id)
        self.refresh()

    def _deleted(self, section, index: int) -> None:
        if self._running or not self._visible_sources or index >= len(self._visible_sources):
            return
        source = self._visible_sources[index]
        removed = self.store.remove_source(source.source_id)
        delete_bookmark(removed.bookmark_name)
        self.refresh()

    def _choose_destination(self) -> None:
        try:
            bookmark_name, path = choose_folder("destination")
            previous = self.store.set_destination(bookmark_name)
            if previous:
                delete_bookmark(previous)
            self.message_label.text = f"Destination : {Path(path).name}"
            self.refresh()
        except PytoUnavailable as exc:
            self.message_label.text = str(exc)

    def _add_source(self, sender=None) -> None:
        if self._running:
            return
        try:
            bookmark_name, path = choose_folder("source")
            selected = Path(path).resolve()
            for existing in self.store.sources():
                try:
                    existing_path = Path(resolve_folder(existing.bookmark_name)).resolve()
                except PytoUnavailable:
                    continue
                if existing_path == selected:
                    delete_bookmark(bookmark_name)
                    self.message_label.text = f"Déjà ajouté : {existing.label}"
                    return
            suggestions = self.store.load().get("suggestedLabels", [])
            label = infer_source_label(path, suggestions)
            self.store.add_source(label, bookmark_name)
            self.message_label.text = f"Ajouté : {label}"
            self.refresh()
        except (PytoUnavailable, ValueError) as exc:
            self.message_label.text = str(exc)

    def _backup(self, sender=None) -> None:
        if self._running:
            if self._operation == "backup" and not self._cancel_requested.is_set():
                self._cancel_requested.set()
                self.state_label.text = "ARRÊT DEMANDÉ"
                self._set_state_color("warning")
                self.message_label.text = "L’étape en cours se termine, puis la reprise sera sécurisée."
                self.backup_button.title = "Arrêt en cours…"
            return
        self._cancel_requested.clear()
        self._running = True
        self._operation = "backup"
        self._last_progress = None
        self._overall_progress = 0.0
        self._set_controls_enabled(False)
        self.backup_button.title = "■  Arrêter la sauvegarde"
        _set_button_appearance(
            self.backup_button, self._color("SYSTEM_RED", "SYSTEM_ORANGE"),
            _solid_white(self.ui), radius=14,
        )
        self.state_label.text = "SAUVEGARDE"
        self._set_state_color("active")
        self.message_label.text = "Vous pouvez changer d’app brièvement pendant la sauvegarde."
        self.phase_label.text = "Démarrage"
        self.counter_label.text = "Préparation en cours"
        self.file_label.text = "Analyse de la configuration"
        self.local_stage.text = "📱 Local · En cours"
        self.drive_stage.text = "☁️ Drive · En attente"
        self._set_diagnostic_visible(False)
        self._last_error_detail = ""
        self._set_progress_fill(0.0)
        self.refresh()
        self.background_execution = BackgroundExecution("ProjectOS Backup complet")
        self.background_execution.begin()
        threading.Thread(target=self._run_backup, daemon=True).start()

    def _should_cancel(self) -> bool:
        return self._cancel_requested.is_set() or self.background_execution.expired.is_set()

    def _test_drive(self, sender=None) -> None:
        if self._running:
            return
        self._running = True
        self._operation = "drive_test"
        self._last_progress = None
        self._overall_progress = 0.0
        self._last_error_detail = ""
        self._set_diagnostic_visible(False)
        self._set_controls_enabled(False)
        self.backup_button.title = "Test de Google Drive…"
        self.state_label.text = "TEST DRIVE"
        self._set_state_color("active")
        self.message_label.text = "Aucun fichier ne sera modifié."
        self.local_stage.text = "📱 Local · Non lancé"
        self.drive_stage.text = "☁️ Drive · Connexion"
        self._set_progress_fill(0.0)
        self.refresh()
        self.background_execution = BackgroundExecution("Test Google Drive")
        self.background_execution.begin()
        threading.Thread(target=self._run_drive_test, daemon=True).start()

    def _load_drive_client(self) -> AppsScriptClient:
        relay = json.loads((self.store.directory / "drive.json").read_text(encoding="utf-8"))
        return AppsScriptClient(relay["url"], relay["token"])

    def _run_drive_test(self) -> None:
        success = False
        message = ""
        try:
            result = preflight_drive(
                self._load_drive_client(), progress=self._show_progress, attempts=2, delays=(0, 2),
                should_cancel=self.background_execution.expired.is_set,
            )
            success = True
            message = "Connexion vérifiée · index disponible" if result["hasManifest"] else "Connexion vérifiée · première sauvegarde à initialiser"
        except Exception as exc:
            message = str(exc).strip() or exc.__class__.__name__
            self._last_error_detail = format_preflight_diagnostic(exc)
        finally:
            self.background_execution.end()
            import mainthread

            def finish():
                self._running = False
                self._operation = None
                self.state_label.text = "DRIVE PRÊT" if success else "DRIVE INDISPONIBLE"
                self._set_state_color("success" if success else "error")
                self.message_label.text = message
                self.phase_label.text = "Connexion vérifiée" if success else "Vérification interrompue"
                self.counter_label.text = "Service, jeton et index accessibles" if success else "Diagnostic disponible"
                self.file_label.text = "Aucun fichier n’a été modifié."
                self.local_stage.text = "📱 Local · Non lancé"
                self.drive_stage.text = f"☁️ Drive · {'Prêt' if success else 'À vérifier'}"
                self._set_progress_fill(1.0 if success else 0.0)
                self._set_diagnostic_visible(not success)
                self._set_controls_enabled(True)
                self.backup_button.title = "Mettre à jour la sauvegarde"
                self.refresh()

            mainthread.run_async(finish)

    def _set_progress_fill(self, ratio: float) -> None:
        _, _, width, height = self.progress_track.frame
        self.progress_fill.frame = (0, 0, int(width * ratio), height)

    def _show_progress(self, event: dict) -> None:
        now = time.monotonic()
        if not should_emit_progress(self._last_progress, event, now):
            return
        title, counter, filename, ratio = progress_copy(event)
        self._last_progress = {
            "phase": event.get("phase"),
            "percent": progress_percent(event.get("completed", 0), event.get("total", 0)),
            "time": now,
        }
        import mainthread

        def update():
            self.phase_label.text = title
            self.counter_label.text = counter
            self.file_label.text = filename
            self.progress_fill.background_color = self._color(progress_color(event), "SYSTEM_BLUE")
            local_state, drive_state = progress_stages(event)
            self.local_stage.text = f"📱 Local · {local_state}"
            self.drive_stage.text = f"☁️ Drive · {drive_state}"
            self._set_progress_fill(ratio)

        mainthread.run_async(update)

    def _run_backup(self) -> None:
        message = ""
        success = False
        result = None
        local_complete = False
        try:
            config = self.store.load()
            destination_name = config.get("destinationBookmark")
            if not destination_name:
                raise BackupError("Choisis d'abord la destination du miroir local")
            destination = resolve_folder(destination_name)
            current = Path(destination) / "Current"
            archive_root = initialize_buffer(buffer_root(destination))
            import_inbox(archive_root)
            client = None
            relay_error = None
            try:
                client = self._load_drive_client()
            except (OSError, json.JSONDecodeError, KeyError, ValueError) as exc:
                relay_error = exc
            prior_drive = None
            drive_seconds = 0.0
            archive_result = {"verified": 0, "pending": queue_summary(archive_root)["pendingTotal"], "uploaded": 0, "resumed": 0, "errors": []}
            if client and has_pending_drive_sync(current):
                local_complete = True
                self._show_progress({"phase": "drive_prepare"})
                drive_started = time.monotonic()
                prior_drive = sync_current(
                    current, client, progress=self._show_progress,
                    should_cancel=self._should_cancel,
                )
                drive_seconds += time.monotonic() - drive_started
                if self._should_cancel():
                    raise BackupError("Le miroir local est sécurisé ; relance pour poursuivre la mise à jour")
            sources = []
            for item in self.store.sources():
                if item.enabled:
                    sources.append(Source(item.source_id, item.label, resolve_folder(item.bookmark_name)))
            local_started = time.monotonic()
            local = run_backup(
                sources,
                destination,
                prepare_file=request_icloud_download,
                progress=self._show_progress,
                should_cancel=self._should_cancel,
                filters=FilterRules.from_config(config.get("filters")),
            )
            local_seconds = time.monotonic() - local_started
            local_complete = True
            if self._should_cancel():
                raise BackupError("Exécution interrompue par iOS ; relance pour reprendre")
            if client is None:
                raise BackupError("Miroir local terminé ; Google Drive non configuré : lance configure_drive.py") from relay_error
            archive_started = time.monotonic()
            archive_result = sync_conversation_buffer(
                archive_root, client,
                progress=lambda event: self._show_progress({**event, "localComplete": True}),
                should_cancel=self._should_cancel,
            )
            drive_seconds += time.monotonic() - archive_started
            drive_started = time.monotonic()
            drive = sync_current(
                current,
                client,
                progress=self._show_progress,
                should_cancel=self._should_cancel,
            )
            drive_seconds += time.monotonic() - drive_started
            if prior_drive:
                for key in ("uploaded_files", "deleted_files", "resumed_files"):
                    drive[key] = int(drive.get(key, 0)) + int(prior_drive.get(key, 0))
            success = True
            result = backup_summary(
                local, drive, local_seconds=local_seconds, drive_seconds=drive_seconds,
                archives=archive_result,
            )
            local_line, drive_line = summary_copy(result)
            message = f"{local_line}\n{drive_line}"
            save_result(self._result_path, result)
        except Exception as exc:
            if self._cancel_requested.is_set():
                message = "Sauvegarde arrêtée. Le travail validé sera repris au prochain lancement."
                _headline, self._last_error_detail = error_copy(exc)
            elif isinstance(exc, DriveSyncError):
                message, self._last_error_detail = str(exc), format_preflight_diagnostic(exc)
            else:
                message, self._last_error_detail = error_copy(exc)
            result = {
                "status": "interrupted",
                "finishedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "message": message,
                "detail": self._last_error_detail,
                "localComplete": local_complete,
            }
            save_result(self._result_path, result)
        finally:
            self.background_execution.end()
            import mainthread

            def finish():
                self._running = False
                self._operation = None
                archive_pending = int((result or {}).get("archives", {}).get("pending", 0)) if success else 0
                self.state_label.text = (
                    "ARCHIVES EN ATTENTE" if success and archive_pending
                    else "À JOUR" if success else "ACTION REQUISE"
                )
                self._set_state_color("warning" if success and archive_pending else "success" if success else "error")
                self.message_label.text = message
                self.phase_label.text = (
                    "Code vérifié · archives conservées dans iCloud" if success and archive_pending
                    else "Sauvegarde complète" if success else "Sauvegarde interrompue"
                )
                if success:
                    headline, drive_line, local_line = compact_summary_copy(result or {})
                    self.message_label.text = headline
                    self.counter_label.text = drive_line
                    self.file_label.text = local_line
                    self.local_stage.text = "📱 Local · Terminé"
                    self.drive_stage.text = "☁️ Drive · Vérifié"
                else:
                    self.counter_label.text = "La reprise est sécurisée"
                    self.file_label.text = "Diagnostic disponible · reprise sans doublon"
                    self.local_stage.text = f"📱 Local · {'Terminé' if local_complete else 'À reprendre'}"
                    self.drive_stage.text = "☁️ Drive · À reprendre"
                    self._set_diagnostic_visible(True)
                self._set_progress_fill(1.0 if success else 0.0)
                self.backup_button.title = "Mettre à jour la sauvegarde" if success else "Réessayer la sauvegarde"
                _set_button_appearance(
                    self.backup_button, self._color("SYSTEM_BLUE", "LABEL"),
                    _solid_white(self.ui), radius=14,
                )
                self._set_controls_enabled(True)
                self.refresh()

            mainthread.run_async(finish)

    def show(self) -> None:
        self._navigation = self.ui.NavigationView(self.root)
        self.ui.show_view(self._navigation, self.ui.PresentationMode.FULLSCREEN)


def main() -> None:
    BackupApplication().show()
