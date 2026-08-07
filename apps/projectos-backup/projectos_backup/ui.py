"""Native PytoUI front-end for configuring and running backups."""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path

from .core import BackupError, Source, run_backup
from .drive_client import AppsScriptClient, sync_current
from .pyto_access import BackgroundExecution, PytoUnavailable, choose_folder, delete_bookmark, request_icloud_download, resolve_folder
from .state import ConfigStore, infer_source_label


PROGRESS_THROTTLE_SECONDS = 0.12
DETERMINATE_PHASES = {"prepare", "mirror", "upload", "delete", "complete"}


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
        "upload": "Envoi vers Google Drive",
        "delete": "Nettoyage du miroir Drive",
        "publish": "Publication du manifeste",
        "complete": "Vérification finale",
    }
    title = titles.get(phase, "Sauvegarde en cours")
    ratio = progress_ratio(completed, total) if phase in DETERMINATE_PHASES else 0.0
    counter = f"{progress_percent(completed, total)} %   ·   {completed} / {total}" if total else "Préparation en cours"
    filename = Path(path).name[:60] if path else "Les fichiers restent disponibles pendant l'opération."
    return title, counter, filename, ratio


class BackupApplication:
    def __init__(self):
        self.ui = _ui()
        self.store = ConfigStore()
        self._running = False
        self._last_progress = None

        self.root = self.ui.View()
        self.root.title = "Backup"
        self.root.size = (390, 820)
        self.root.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND

        self.header = self.ui.View()
        self.header.frame = (16, 12, 358, 64)
        self.header.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.state_label = self.ui.Label("PRÊT")
        self.state_label.frame = (16, 8, 326, 22)
        self.state_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.message_label = self.ui.Label("Configurez vos sources puis lancez la mise à jour.")
        self.message_label.frame = (16, 30, 326, 28)
        self.message_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.message_label.number_of_lines = 2
        self.header.add_subview(self.state_label)
        self.header.add_subview(self.message_label)
        self.status = self.message_label

        self.progress_card = self.ui.View()
        self.progress_card.frame = (16, 88, 358, 154)
        self.progress_card.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.phase_label = self.ui.Label("Sauvegarde prête")
        self.phase_label.frame = (16, 12, 326, 28)
        self.phase_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.counter_label = self.ui.Label("Aucune opération en cours")
        self.counter_label.frame = (16, 42, 326, 24)
        self.counter_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.progress_track = self.ui.View()
        self.progress_track.frame = (16, 76, 326, 10)
        self.progress_track.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.progress_fill = self.ui.View()
        self.progress_fill.frame = (0, 0, 0, 10)
        self.progress_track.add_subview(self.progress_fill)
        self.file_label = self.ui.Label("Local → Google Drive · miroir vérifié")
        self.file_label.frame = (16, 96, 326, 42)
        self.file_label.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH]
        self.file_label.number_of_lines = 2
        for view in (self.phase_label, self.counter_label, self.progress_track, self.file_label):
            self.progress_card.add_subview(view)

        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = (0, 252, 390, 418)
        self.table.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.table.did_select_cell = self._selected
        self.table.did_delete_cell = self._deleted

        self.add_button = self.ui.Button(title="Ajouter un dossier")
        self.add_button.frame = (20, 682, 350, 38)
        self.add_button.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.add_button.action = self._add_source
        self.backup_button = self.ui.Button(title="Mettre à jour la sauvegarde")
        self.backup_button.frame = (20, 730, 350, 54)
        self.backup_button.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.backup_button.action = self._backup

        for view in (self.header, self.progress_card, self.table, self.add_button, self.backup_button):
            self.root.add_subview(view)
        self._apply_colors()
        self.refresh()

    def _color(self, name: str, fallback: str):
        return getattr(self.ui.SystemColors, name, getattr(self.ui.SystemColors, fallback))

    def _apply_colors(self) -> None:
        card = self._color("SECONDARY_SYSTEM_BACKGROUND", "SYSTEM_BACKGROUND")
        self.header.background_color = card
        self.progress_card.background_color = card
        self.progress_track.background_color = self._color("SYSTEM_GRAY_5", "SYSTEM_BACKGROUND")
        self.progress_fill.background_color = self._color("SYSTEM_BLUE", "SYSTEM_BACKGROUND")

    def alert(self, title: str, message: str) -> str:
        alert = self.ui.Alert(title, message)
        alert.add_action("OK")
        return alert.show()

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
        self.backup_button.enabled = False
        self.add_button.enabled = False
        self.state_label.text = "EN COURS"
        self.message_label.text = "La sauvegarde peut continuer pendant un changement d'app court."
        self.phase_label.text = "Démarrage"
        self.counter_label.text = "Préparation en cours"
        self.file_label.text = "Analyse de la configuration"
        self._set_progress_fill(0.0)
        self.refresh()
        self.background_execution = BackgroundExecution("ProjectOS Backup complet")
        self.background_execution.begin()
        threading.Thread(target=self._run_backup, daemon=True).start()

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
            self._set_progress_fill(ratio)

        mainthread.run_async(update)

    def _run_backup(self) -> None:
        message = ""
        success = False
        try:
            config = self.store.load()
            destination_name = config.get("destinationBookmark")
            if not destination_name:
                raise BackupError("Choisis d'abord la destination du miroir local")
            destination = resolve_folder(destination_name)
            sources = []
            for item in self.store.sources():
                if item.enabled:
                    sources.append(Source(item.source_id, item.label, resolve_folder(item.bookmark_name)))
            local = run_backup(
                sources,
                destination,
                prepare_file=request_icloud_download,
                progress=self._show_progress,
                should_cancel=self.background_execution.expired.is_set,
            )
            if self.background_execution.expired.is_set():
                raise BackupError("Exécution interrompue par iOS ; relance pour reprendre")
            self._show_progress({"phase": "drive_prepare"})
            try:
                relay = json.loads((self.store.directory / "drive.json").read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                raise BackupError("Google Drive non configuré : lance configure_drive.py") from exc
            drive = sync_current(
                Path(destination) / "Current",
                AppsScriptClient(relay["url"], relay["token"]),
                progress=self._show_progress,
            )
            success = True
            message = (
                f"Local : {local.copied_files} copiés, {getattr(local, 'resumed_files', 0)} repris, "
                f"{local.deleted_files} supprimés\n"
                f"Drive : {drive['uploaded_files']} envoyés, {drive['deleted_files']} supprimés, "
                f"{drive['verified_files']} vérifiés"
            )
        except Exception as exc:
            message = str(exc)
        finally:
            self.background_execution.end()
            import mainthread

            def finish():
                self._running = False
                self.state_label.text = "SAUVEGARDE VÉRIFIÉE" if success else "ACTION NÉCESSAIRE"
                self.message_label.text = message
                self.phase_label.text = "Terminé" if success else "Sauvegarde interrompue"
                self.counter_label.text = "100 % · miroir local et Drive validés" if success else "Vous pouvez relancer sans perdre le miroir valide"
                self.file_label.text = "Tous les fichiers sont à jour." if success else "Consultez le message ci-dessus puis réessayez."
                self._set_progress_fill(1.0 if success else 0.0)
                self.backup_button.title = "Mettre à jour la sauvegarde" if success else "Réessayer la sauvegarde"
                self.backup_button.enabled = True
                self.add_button.enabled = True
                self.refresh()

            mainthread.run_async(finish)

    def show(self) -> None:
        navigation = self.ui.NavigationView(self.root)
        self.ui.show_view(navigation, self.ui.PresentationMode.FULLSCREEN)


def main() -> None:
    BackupApplication().show()
