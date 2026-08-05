import tempfile
import unittest
from pathlib import Path

from projectos_backup.state import ConfigStore, infer_source_label


class ConfigStoreTests(unittest.TestCase):
    def test_add_toggle_rename_remove_and_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = ConfigStore(Path(tmp))
            source = store.add_source("Documents", "bookmark-1")
            renamed = store.rename_source(source.source_id, "Pyto")
            self.assertEqual(renamed.label, "Pyto")
            self.assertTrue(store.sources()[0].enabled)
            self.assertFalse(store.toggle_source(source.source_id))
            self.assertIsNone(store.set_destination("destination-1"))
            self.assertEqual(store.load()["destinationBookmark"], "destination-1")
            removed = store.remove_source(source.source_id)
            self.assertEqual(removed.bookmark_name, "bookmark-1")
            self.assertEqual(store.sources(), [])

    def test_infers_pyto_from_ios_documents_container(self):
        path = "/private/var/mobile/Library/Mobile Documents/iCloud~example~Pyto/Documents"
        self.assertEqual(infer_source_label(path, ["Pyto", "Scriptable"]), "Pyto")

    def test_preserves_normal_folder_name(self):
        self.assertEqual(infer_source_label("/iCloud Drive/Maestro", ["Pyto"]), "Maestro")

    def test_keeps_documents_when_provider_is_unknown(self):
        self.assertEqual(infer_source_label("/provider/unknown/Documents", ["Pyto"]), "Documents")


if __name__ == "__main__":
    unittest.main()
