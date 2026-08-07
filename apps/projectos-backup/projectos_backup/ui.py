"""Native PytoUI front-end for configuring and running backups."""

from __future__ import annotations

import json
import os
import threading
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

from .core import BackupError, Source, run_backup
from .drive_client import AppsScriptClient, DriveSyncError, format_preflight_diagnostic, has_pending_drive_sync, preflight_drive, sync_current
from .pyto_access import BackgroundExecution, PytoUnavailable, choose_folder, delete_bookmark, request_icloud_download, resolve_folder
from .state import ConfigStore, infer_source_label


PROGRESS_THROTTLE_SECONDS = 0.12
DETERMINATE_PHASES = {"prepare", "mirror", "upload_prepare", "upload", "delete", "complete"}
RESULT_FILE = "last_ui_result.json"
LOCAL_PHASES = {"scan", "prepare", "mirror"}
DRIVE_PHASES = {
    "drive_prepare", "drive_wake", "drive_auth", "drive_manifest", "drive_retry", "drive_ready",
    "upload_prepare", "upload", "delete", "publish", "complete",
}
DRIVE_PREFLIGHT_PHASES = {"drive_wake", "drive_auth", "drive_manifest", "drive_retry", "drive_ready"}


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
    ratio = progress_ratio(completed, total) if phase in DETERMINATE_PHASES else 0.0
    if event.get("maxAttempts"):
        counter = f"Tentative {event.get('attempt', 1)} / {event['maxAttempts']}"
    else:
        counter = f"{progress_percent(completed, total)} %   ·   {completed} / {total}" if total else "Préparation en cours"
    message = event.get("message", "")
    filename = message[:100] if message else (Path(path).name[:60] if path else "Les fichiers restent disponibles pendant l'opération.")
    return title, counter, filename, ratio


def progress_stages(event: dict) -> tuple[str, str]:
    """Return concise local and Drive states for a progress event."""
    phase = event.get("phase")
    if phase in LOCAL_PHASES:
        return "En cours", "En attente"
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
    table_top = 316
    action_height = 166
    action_y = page_height - action_height - margin
    table_height = max(96, action_y - table_top - 10)
    return {
        "table": (0, table_top, page_width, table_height),
        "actions": (margin, action_y, page_width - 2 * margin, action_height),
    }


def backup_summary(local, drive: dict, local_seconds: float = 0.0, drive_seconds: float = 0.0) -> dict:
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
    return local_line, drive_line


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


class BackupApplication:
    def __init__(self):
        self.ui = _ui()
        self.store = ConfigStore()
        self._running = False
        self._last_progress = None
        self._last_error_detail = ""
        self._navigation = None
        self._result_path = self.store.directory / RESULT_FILE

        self.root = self.ui.View()
        self.root.title = "Backup"
        self.root.size = (390, 820)
        self.root.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND
        layout = responsive_layout(*self.root.size)

        self.header = self.ui.View()
        self.header.frame = (16, 12, 358, 92)
        self.header.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.state_label = self.ui.Label("PRÊT")
        self.state_label.frame = (16, 10, 238, 22)
        self.state_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.message_label = self.ui.Label("Configurez vos sources puis lancez la mise à jour.")
        self.message_label.frame = (16, 34, 326, 50)
        self.message_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.message_label.number_of_lines = 3
        self.close_button = self.ui.Button(title="✕ Fermer")
        self.close_button.frame = (270, 8, 76, 30)
        self.close_button.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN]
        self.close_button.action = self._close
        self.header.add_subview(self.state_label)
        self.header.add_subview(self.message_label)
        self.header.add_subview(self.close_button)
        self.status = self.message_label

        self.progress_card = self.ui.View()
        self.progress_card.frame = (16, 116, 358, 190)
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
        self.local_stage = self.ui.Label("●  Miroir local    En attente")
        self.local_stage.frame = (16, 96, 326, 24)
        self.local_stage.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.drive_stage = self.ui.Label("○  Google Drive    En attente")
        self.drive_stage.frame = (16, 120, 326, 24)
        self.drive_stage.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.file_label.frame = (16, 148, 326, 34)
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

        self.add_button = self.ui.Button(title="Ajouter un dossier")
        self.add_button.frame = (181, 12, 161, 38)
        self.add_button.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN]
        self.add_button.action = self._add_source
        self.backup_button = self.ui.Button(title="Mettre à jour la sauvegarde")
        self.backup_button.frame = (12, 100, 334, 54)
        self.backup_button.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.backup_button.action = self._backup

        self.detail_button = self.ui.Button(title="Afficher le détail")
        self.detail_button.frame = (12, 58, 161, 32)
        self.detail_button.flex = [self.ui.AutoResizing.FLEXIBLE_RIGHT_MARGIN, self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.detail_button.action = self._show_error_detail
        self.detail_button.hidden = True

        self.copy_button = self.ui.Button(title="Copier le diagnostic")
        self.copy_button.frame = (181, 58, 161, 32)
        self.copy_button.flex = [self.ui.AutoResizing.FLEXIBLE_LEFT_MARGIN, self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.copy_button.action = self._copy_error_detail
        self.copy_button.hidden = True

        self.test_drive_button = self.ui.Button(title="Tester Drive")
        self.test_drive_button.frame = (12, 12, 161, 38)
        self.test_drive_button.flex = [self.ui.AutoResizing.FLEXIBLE_RIGHT_MARGIN]
        self.test_drive_button.action = self._test_drive

        for view in (
            self.test_drive_button, self.add_button, self.detail_button, self.copy_button, self.backup_button,
        ):
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
        if self._last_error_detail:
            self.alert("Détail du diagnostic", self._last_error_detail)

    def _copy_error_detail(self, sender=None) -> None:
        if not self._last_error_detail:
            return
        try:
            import pasteboard
            pasteboard.set_string(self._last_error_detail)
            self.message_label.text = "Diagnostic copié dans le presse-papiers."
        except Exception:
            self.alert("Diagnostic à copier", self._last_error_detail)

    def _set_controls_enabled(self, enabled: bool) -> None:
        self.backup_button.enabled = enabled
        self.add_button.enabled = enabled
        self.test_drive_button.enabled = enabled

    def _restore_last_result(self) -> None:
        result = load_result(self._result_path)
        if not result:
            return
        if result.get("status") == "complete":
            local_line, drive_line = summary_copy(result)
            self.state_label.text = "SAUVEGARDE VÉRIFIÉE"
            self.message_label.text = result.get("finishedAt", "Résultat conservé")
            self.phase_label.text = "Tout est à jour"
            self.counter_label.text = drive_line
            self.file_label.text = local_line
            self.local_stage.text = "●  Miroir local    Terminé"
            self.drive_stage.text = "●  Google Drive    Vérifié"
            self._set_progress_fill(1.0)
        elif result.get("status") == "interrupted":
            self.state_label.text = "REPRISE DISPONIBLE"
            self.message_label.text = result.get("message", "Une opération reste à reprendre.")
            self.phase_label.text = "Sauvegarde interrompue"
            local_complete = bool(result.get("localComplete"))
            self.counter_label.text = "Le miroir local valide est conservé" if local_complete else "Le miroir local devra reprendre"
            self.file_label.text = "Relancez pour reprendre les éléments non confirmés."
            self.local_stage.text = f"●  Miroir local    {'Terminé' if local_complete else 'À reprendre'}"
            self.drive_stage.text = "○  Google Drive    À reprendre"
            self._last_error_detail = result.get("detail", "")
            self.detail_button.hidden = not bool(self._last_error_detail)
            self.copy_button.hidden = not bool(self._last_error_detail)

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
        config = self.store.load()
        cells = []
        destination = self.ui.TableViewCell(text="Destination du miroir local")
        destination.detail_text_label.text = "Configurée" if config.get("destinationBookmark") else "À choisir avant la première sauvegarde"
        destination.accessory_type = self.ui.AccessoryType.DISCLOSURE_INDICATOR
        cells.append(destination)
        self._visible_sources = self._sources_with_repaired_labels()
        for source in self._visible_sources:
            cell = self.ui.TableViewCell(text=source.label)
            cell.detail_text_label.text = "Active · touchez pour suspendre" if source.enabled else "Suspendue · touchez pour activer"
            cell.accessory_type = self.ui.AccessoryType.CHECKMARK if source.enabled else self.ui.AccessoryType.NONE
            cell.removable = not self._running
            cells.append(cell)
        self.table.set_cells(cells)

    def _selected(self, section, index: int) -> None:
        section.table_view.deselect_row()
        if self._running:
            return
        if index == 0:
            self._choose_destination()
            return
        source = self._visible_sources[index - 1]
        self.store.toggle_source(source.source_id)
        self.refresh()

    def _deleted(self, section, index: int) -> None:
        if self._running or index == 0:
            return
        source = self._visible_sources[index - 1]
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
            return
        self._running = True
        self._last_progress = None
        self._set_controls_enabled(False)
        self.state_label.text = "EN COURS"
        self.message_label.text = "La sauvegarde peut continuer pendant un changement d'app court."
        self.phase_label.text = "Démarrage"
        self.counter_label.text = "Préparation en cours"
        self.file_label.text = "Analyse de la configuration"
        self.local_stage.text = "●  Miroir local    En cours"
        self.drive_stage.text = "○  Google Drive    En attente"
        self.detail_button.hidden = True
        self.copy_button.hidden = True
        self._last_error_detail = ""
        self._set_progress_fill(0.0)
        self.refresh()
        self.background_execution = BackgroundExecution("ProjectOS Backup complet")
        self.background_execution.begin()
        threading.Thread(target=self._run_backup, daemon=True).start()

    def _test_drive(self, sender=None) -> None:
        if self._running:
            return
        self._running = True
        self._last_progress = None
        self._last_error_detail = ""
        self.detail_button.hidden = True
        self.copy_button.hidden = True
        self._set_controls_enabled(False)
        self.state_label.text = "TEST DE CONNEXION"
        self.message_label.text = "Aucun fichier ne sera modifié."
        self.local_stage.text = "○  Miroir local    Non lancé"
        self.drive_stage.text = "●  Google Drive    Connexion"
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
                self.state_label.text = "DRIVE PRÊT" if success else "CONNEXION IMPOSSIBLE"
                self.message_label.text = message
                self.phase_label.text = "Connexion vérifiée" if success else "Vérification interrompue"
                self.counter_label.text = "Service, jeton et index accessibles" if success else "Diagnostic disponible"
                self.file_label.text = "Aucun fichier n’a été modifié."
                self.local_stage.text = "○  Miroir local    Non lancé"
                self.drive_stage.text = f"{'●' if success else '○'}  Google Drive    {'Prêt' if success else 'À vérifier'}"
                self._set_progress_fill(1.0 if success else 0.0)
                self.test_drive_button.title = "Tester Google Drive" if success else "Réessayer le test Drive"
                self.detail_button.hidden = success
                self.copy_button.hidden = success
                self._set_controls_enabled(True)
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
            local_state, drive_state = progress_stages(event)
            self.local_stage.text = f"●  Miroir local    {local_state}"
            drive_dot = "●" if drive_state in {"Connexion", "En cours", "Vérifié"} else "○"
            self.drive_stage.text = f"{drive_dot}  Google Drive    {drive_state}"
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
            client = None
            relay_error = None
            try:
                client = self._load_drive_client()
            except (OSError, json.JSONDecodeError, KeyError, ValueError) as exc:
                relay_error = exc
            prior_drive = None
            drive_seconds = 0.0
            if client and has_pending_drive_sync(current):
                local_complete = True
                self._show_progress({"phase": "drive_prepare"})
                drive_started = time.monotonic()
                prior_drive = sync_current(
                    current, client, progress=self._show_progress,
                    should_cancel=self.background_execution.expired.is_set,
                )
                drive_seconds += time.monotonic() - drive_started
                if self.background_execution.expired.is_set():
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
                should_cancel=self.background_execution.expired.is_set,
            )
            local_seconds = time.monotonic() - local_started
            local_complete = True
            if self.background_execution.expired.is_set():
                raise BackupError("Exécution interrompue par iOS ; relance pour reprendre")
            if client is None:
                raise BackupError("Miroir local terminé ; Google Drive non configuré : lance configure_drive.py") from relay_error
            drive_started = time.monotonic()
            drive = sync_current(
                current,
                client,
                progress=self._show_progress,
                should_cancel=self.background_execution.expired.is_set,
            )
            drive_seconds += time.monotonic() - drive_started
            if prior_drive:
                for key in ("uploaded_files", "deleted_files", "resumed_files"):
                    drive[key] = int(drive.get(key, 0)) + int(prior_drive.get(key, 0))
            success = True
            result = backup_summary(local, drive, local_seconds=local_seconds, drive_seconds=drive_seconds)
            local_line, drive_line = summary_copy(result)
            message = f"{local_line}\n{drive_line}"
            save_result(self._result_path, result)
        except Exception as exc:
            if isinstance(exc, DriveSyncError):
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
                self.state_label.text = "SAUVEGARDE VÉRIFIÉE" if success else "ACTION NÉCESSAIRE"
                self.message_label.text = message
                self.phase_label.text = "Sauvegarde complète" if success else "Sauvegarde interrompue"
                if success:
                    local_line, drive_line = summary_copy(result or {})
                    self.counter_label.text = drive_line
                    self.file_label.text = local_line
                    self.local_stage.text = "●  Miroir local    Terminé"
                    self.drive_stage.text = "●  Google Drive    Vérifié"
                else:
                    self.counter_label.text = "La reprise est sécurisée"
                    self.file_label.text = "Touchez « Afficher le détail » pour le diagnostic complet."
                    self.local_stage.text = f"●  Miroir local    {'Terminé' if local_complete else 'À reprendre'}"
                    self.drive_stage.text = "○  Google Drive    À reprendre"
                    self.detail_button.hidden = False
                    self.copy_button.hidden = False
                self._set_progress_fill(1.0 if success else 0.0)
                self.backup_button.title = "Mettre à jour la sauvegarde" if success else "Réessayer la sauvegarde"
                self._set_controls_enabled(True)
                self.refresh()

            mainthread.run_async(finish)

    def show(self) -> None:
        self._navigation = self.ui.NavigationView(self.root)
        self.ui.show_view(self._navigation, self.ui.PresentationMode.FULLSCREEN)


def main() -> None:
    BackupApplication().show()
