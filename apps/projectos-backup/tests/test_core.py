import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from helpers import ROOT  # noqa: F401
from projectos_backup import core
from projectos_backup.core import BackupError, Source, SourceAccessError, UnsafeLayoutError, run_backup

class MirrorTests(unittest.TestCase):
    def test_incremental_copy_delete_and_prefetch(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir()
            (source/'a.txt').write_text('a'); (source/'b.txt').write_text('b')
            requested=[]
            first=run_backup([Source('one','Source',str(source))],dest,lambda p: requested.append(p) or True)
            self.assertEqual((first.copied_files,first.unchanged_files,first.requested_downloads),(2,0,2))
            self.assertEqual(len(requested),2)
            second=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual((second.copied_files,second.unchanged_files),(0,2))
            (source/'a.txt').write_text('changed'); (source/'b.txt').unlink(); (source/'c.txt').write_text('c')
            third=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual((third.copied_files,third.deleted_files,third.unchanged_files),(2,1,0))
            self.assertEqual((dest/'Current'/'Source'/'a.txt').read_text(),'changed')
            self.assertFalse((dest/'Current'/'Source'/'b.txt').exists())

    def test_read_failure_preserves_current(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); f=source/'a'; f.write_text('old')
            run_backup([Source('one','Source',str(source))],dest); before=(dest/'Current'/'MANIFEST.json').read_text(); f.write_text('new')
            with patch.object(core,'_copy_and_hash',side_effect=SourceAccessError('offline')):
                with self.assertRaises(SourceAccessError): run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual((dest/'Current'/'Source'/'a').read_text(),'old')
            self.assertEqual((dest/'Current'/'MANIFEST.json').read_text(),before)

    def test_legacy_zip_removed_after_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); (source/'a').write_text('a')
            (dest/'Current').mkdir(parents=True); (dest/'Current'/'Old.zip').write_text('zip'); (dest/'ProjectOS-Backup-Current.zip').write_text('bundle')
            run_backup([Source('one','Source',str(source))],dest)
            self.assertFalse((dest/'Current'/'Old.zip').exists()); self.assertFalse((dest/'ProjectOS-Backup-Current.zip').exists())
            self.assertEqual(json.loads((dest/'Current'/'MANIFEST.json').read_text())['schemaVersion'],2)

    def test_collision_and_layout(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); a=root/'a'; b=root/'b'; a.mkdir(); b.mkdir(); (a/'x').write_text('1'); (b/'x').write_text('2')
            run_backup([Source('a','Même',str(a)),Source('b','Même',str(b))],root/'dest')
            self.assertTrue((root/'dest'/'Current'/'Meme'/'x').exists()); self.assertTrue((root/'dest'/'Current'/'Meme-2'/'x').exists())
            with self.assertRaises(UnsafeLayoutError): run_backup([Source('a','A',str(a))],a/'backup')

    def test_walk_error(self):
        def broken(*args,**kwargs): kwargs['onerror'](OSError(5,'offline','/virtual')); return iter(())
        with patch.object(core.os,'walk',side_effect=broken):
            with self.assertRaises(SourceAccessError): list(core.iter_source_files(Path('/virtual')))

if __name__=='__main__': unittest.main()
