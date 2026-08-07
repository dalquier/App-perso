"""Native PytoUI front-end for configuring and running backups."""

from __future__ import annotations

import json
import threading
from pathlib import Path

from projectos_backup.core import BackupError, Source, run_backup
from projectos_backup.drive_client import AppsScriptClient, sync_current
from projectos_backup.pyto_access import BackgroundExecution, PytoUnavailable, choose_folder, delete_bookmark, request_icloud_download, resolve_folder
from projectos_backup.state import ConfigStore, infer_source_label


def _ui():
    try:
        import pyto_ui as ui
    except ImportError as exc:
        raise PytoUnavailable("L'interface doit être lancée dans Pyto") from exc
    return ui


def progress_bar(completed: int, total: int, width: int = 18) -> str:
    """Return a compact progress bar suitable for a native Pyto label."""
    ratio = min(1.0, max(0.0, completed / total)) if total else 0.0
    filled = int(ratio * width)
    return "█" * filled + "░" * (width - filled)


class BackupApplication:
    def __init__(self):
        self.ui = _ui()
        self.store = ConfigStore()
        self.root = self.ui.View()
        self.root.title = "ProjectOS Backup"
        self.root.size = (390, 820)
        self.root.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND
        self.status = self.ui.Label("Prêt")
        self.status.frame = (20, 10, 350, 96)
        self.status.number_of_lines = 5
        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = (0, 112, 390, 552)
        self.table.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.table.did_select_cell = self._selected
        self.table.did_delete_cell = self._deleted
        self.add_button = self.ui.Button(title="＋ Ajouter un dossier")
        self.add_button.frame = (20, 678, 132, 50)
        self.add_button.flex = [self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.add_button.action = self._add_source
        self.backup_button = self.ui.Button(title="Mettre à jour la sauvegarde")
        self.backup_button.frame = (160, 678, 210, 50)
        self.backup_button.flex = [self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.backup_button.action = self._backup
        for view in (self.status, self.table, self.add_button, self.backup_button):
            self.root.add_subview(view)
        self.refresh()

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
        destination = self.ui.TableViewCell(text="Destination de transit")
        destination.detail_text_label.text = "Configurée" if config.get("destinationBookmark") else "À choisir"
        destination.accessory_type = self.ui.AccessoryType.DISCLOSURE_INDICATOR
        cells.append(destination)
        for source in self._sources_with_repaired_labels():
            cell = self.ui.TableViewCell(text=source.label)
            cell.detail_text_label.text = "Active" if source.enabled else "Suspendue"
            cell.accessory_type = self.ui.AccessoryType.CHECKMARK if source.enabled else self.ui.AccessoryType.NONE
            cell.removable = True
            cells.append(cell)
        self.table.set_cells(cells)

    def _selected(self, section, index: int) -> None:
        section.table_view.deselect_row()
        if index == 0:
            self._choose_destination()
            return
        source = self.store.sources()[index - 1]
        self.store.toggle_source(source.source_id)
        self.refresh()

    def _deleted(self, section, index: int) -> None:
        if index == 0:
            return
        source = self.store.sources()[index - 1]
        removed = self.store.remove_source(source.source_id)
        delete_bookmark(removed.bookmark_name)
        self.refresh()

    def _choose_destination(self) -> None:
        try:
            bookmark_name, path = choose_folder("destination")
            previous = self.store.set_destination(bookmark_name)
            if previous:
                delete_bookmark(previous)
            self.status.text = f"Destination : {Path(path).name}"
            self.refresh()
        except PytoUnavailable as exc:
            self.status.text = str(exc)

    def _add_source(self, sender=None) -> None:
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
                    self.status.text = f"Déjà ajouté : {existing.label}"
                    return
            suggestions = self.store.load().get("suggestedLabels", [])
            label = infer_source_label(path, suggestions)
            self.store.add_source(label, bookmark_name)
            self.status.text = f"Ajouté : {label}"
            self.refresh()
        except (PytoUnavailable, ValueError) as exc:
            self.status.text = str(exc)

    def _backup(self, sender=None) -> None:
        self.backup_button.enabled = False
        self.status.text = "Démarrage du miroir…"
        self.background_execution = BackgroundExecution("ProjectOS Backup complet")
        self.background_execution.begin()
        threading.Thread(target=self._run_backup, daemon=True).start()

    def _set_status(self, text: str) -> None:
        import mainthread
        mainthread.run_async(lambda: setattr(self.status, "text", text))

    def _show_progress(self, event: dict) -> None:
        phase = event.get("phase")
        completed = event.get("completed", 0)
        total = event.get("total", 0)
        label = event.get("label", "")
        path = event.get("path", "")
        percent = int(completed * 100 / total) if total else 0
        bar = progress_bar(completed, total)
        if phase == "scan":
            text = f"Analyse de {label}…"
        elif phase == "prepare":
            text = f"Chargement iCloud  {percent}%\n{bar}  {completed}/{total}"
        elif phase == "mirror":
            text = f"Miroir local  {percent}%\n{bar}  {completed}/{total}"
        elif phase == "drive_prepare":
            text = "Connexion à Google Drive…"
        elif phase == "upload":
            text = f"Envoi vers Drive  {percent}%\n{bar}  {completed}/{total}"
        elif phase == "delete":
            text = f"Nettoyage Drive  {percent}%\n{bar}  {completed}/{total}"
        elif phase == "publish":
            text = "Publication sécurisée du miroir…"
        elif phase == "complete":
            text = f"Finalisation Drive  100%\n{progress_bar(1, 1)}"
        else:
            return
        if path and phase in {"prepare", "mirror", "upload", "delete"}:
            text += "\n" + Path(path).name[:42]
        self._set_status(text)

    def _run_backup(self) -> None:
        message = ""
        try:
            config = self.store.load()
            destination_name = config.get("destinationBookmark")
            if not destination_name:
                raise BackupError("Choisis d'abord la destination de transit")
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
                raise BackupError("Exécution interrompue par iOS ; relance la sauvegarde")
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
            message = (
                "Sauvegarde vérifiée\n"
                f"Local : {local.copied_files} copiés, {local.deleted_files} supprimés\n"
                f"Drive : {drive['uploaded_files']} envoyés, {drive['deleted_files']} supprimés, "
                f"{drive['verified_files']} vérifiés"
            )
        except Exception as exc:
            message = f"Échec : {exc}"
        finally:
            self.background_execution.end()
            import mainthread

            def finish():
                self.status.text = message
                self.backup_button.enabled = True

            mainthread.run_async(finish)

    def show(self) -> None:
        navigation = self.ui.NavigationView(self.root)
        self.ui.show_view(navigation, self.ui.PresentationMode.FULLSCREEN)


def main() -> None:
    BackupApplication().show()
