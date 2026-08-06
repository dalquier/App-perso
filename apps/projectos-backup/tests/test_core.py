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
            events=[]
            first=run_backup([Source('one','Source',str(source))],dest,lambda p: requested.append(p) or True,progress=events.append)
            self.assertEqual((first.copied_files,first.unchanged_files,first.requested_downloads),(2,0,2))
            self.assertEqual(len(requested),2)
            self.assertEqual(events[-1]['phase'],'complete')
            self.assertTrue(any(event['phase']=='mirror' and event['total']==2 for event in events))
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
            (dest/'Current').mkdir(parents=True); (dest/'Current'/'Old.zip').write_text('zip'); (dest/'Current'/'keep').mkdir(); (dest/'Current'/'keep'/'note').write_text('safe'); (dest/'ProjectOS-Backup-Current.zip').write_text('bundle')
            run_backup([Source('one','Source',str(source))],dest)
            self.assertFalse((dest/'Current'/'Old.zip').exists()); self.assertFalse((dest/'ProjectOS-Backup-Current.zip').exists())
            self.assertEqual((dest/'Current'/'keep'/'note').read_text(),'safe')
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

    def test_corrupt_mirror_is_repaired(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); (source/'a').write_text('good')
            run_backup([Source('one','Source',str(source))],dest)
            (dest/'Current'/'Source'/'a').write_text('evil')
            result=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual(result.copied_files,1)
            self.assertEqual((dest/'Current'/'Source'/'a').read_text(),'good')

    def test_interrupted_publish_is_recovered(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); dest=root/'backup'; current=dest/'Current'; tx=dest/'Transaction'/'old'; rollback=tx/'rollback'/'Current'
            current.mkdir(parents=True); rollback.mkdir(parents=True)
            (current/'changed').write_text('partial'); (current/'created').write_text('new'); (rollback/'changed').write_text('stable')
            (tx/'JOURNAL.json').write_text(json.dumps({'state':'applying','created':['Current/created']}))
            core._recover_transactions(dest)
            self.assertEqual((current/'changed').read_text(),'stable'); self.assertFalse((current/'created').exists())

    def test_cancellation_preserves_previous_mirror(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); item=source/'a'; item.write_text('old')
            run_backup([Source('one','Source',str(source))],dest); item.write_text('new')
            with self.assertRaises(BackupError):
                run_backup([Source('one','Source',str(source))],dest,should_cancel=lambda: True)
            self.assertEqual((dest/'Current'/'Source'/'a').read_text(),'old')

    def test_broken_progress_display_does_not_break_backup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; source.mkdir(); (source/'a').write_text('safe')
            result=run_backup(
                [Source('one','Source',str(source))],
                root/'backup',
                progress=lambda event: (_ for _ in ()).throw(RuntimeError('display')),
            )
            self.assertEqual(result.status,'complete')

if __name__=='__main__': unittest.main()
