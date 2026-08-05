import tempfile
import unittest
from pathlib import Path

from helpers import ROOT  # noqa: F401
from projectos_backup.state import ConfigStore


class ConfigStoreTests(unittest.TestCase):
    def test_add_toggle_remove_and_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = ConfigStore(Path(tmp))
            source = store.add_source("Pyto", "bookmark-1")
            self.assertTrue(store.sources()[0].enabled)
            self.assertFalse(store.toggle_source(source.source_id))
            self.assertIsNone(store.set_destination("destination-1"))
            self.assertEqual(store.load()["destinationBookmark"], "destination-1")
            removed = store.remove_source(source.source_id)
            self.assertEqual(removed.bookmark_name, "bookmark-1")
            self.assertEqual(store.sources(), [])


if __name__ == "__main__":
    unittest.main()

