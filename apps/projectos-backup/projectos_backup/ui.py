"""Native PytoUI front-end for configuring and running backups."""

from __future__ import annotations

import threading
from pathlib import Path

from .core import BackupError, Source, run_backup
from .pyto_access import PytoUnavailable, choose_folder, delete_bookmark, request_icloud_download, resolve_folder
from .state import ConfigStore, infer_source_label


def _ui():
    try:
        import pyto_ui as ui
    except ImportError as exc:
        raise PytoUnavailable("L'interface doit être lancée dans Pyto") from exc
    return ui


class BackupApplication:
    def __init__(self):
        self.ui = _ui()
        self.store = ConfigStore()
        self.root = self.ui.View()
        self.root.title = "ProjectOS Backup"
        self.root.size = (390, 820)
        self.root.background_color = self.ui.SystemColors.SYSTEM_BACKGROUND
        self.status = self.ui.Label("Prêt")
        self.status.frame = (20, 14, 350, 44)
        self.status.number_of_lines = 2
        self.table = self.ui.TableView(style=self.ui.TableViewStyle.INSET_GROUPED)
        self.table.frame = (0, 64, 390, 600)
        self.table.flex = [self.ui.AutoResizing.FLEXIBLE_WIDTH, self.ui.AutoResizing.FLEXIBLE_HEIGHT]
        self.table.did_select_cell = self._selected
        self.table.did_delete_cell = self._deleted
        self.add_button = self.ui.Button(title="＋ Ajouter un dossier")
        self.add_button.frame = (20, 678, 170, 50)
        self.add_button.flex = [self.ui.AutoResizing.FLEXIBLE_TOP_MARGIN]
        self.add_button.action = self._add_source
        self.backup_button = self.ui.Button(title="Sauvegarder maintenant")
        self.backup_button.frame = (200, 678, 170, 50)
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
        self.status.text = "Préchargement iCloud et synchronisation…"
        threading.Thread(target=self._run_backup, daemon=True).start()

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
            result = run_backup(sources, destination)
            files = sum(item.file_count for item in result.archives)
            message = f"Sauvegarde vérifiée : {files} fichiers"
        except Exception as exc:
            message = f"Échec : {exc}"
        finally:
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
