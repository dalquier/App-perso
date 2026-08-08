import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from helpers import ROOT  # noqa: F401
from projectos_backup import core
from projectos_backup.core import BackupError, FilterRules, Source, SourceAccessError, UnsafeLayoutError, run_backup

class MirrorTests(unittest.TestCase):
    def test_configurable_filters_default_to_all_extensions(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; source.mkdir()
            (source/'keep.py').write_text('code'); (source/'skip.log').write_text('log')
            (source/'cache').mkdir(); (source/'cache'/'inside.py').write_text('cached')
            default_names=[relative for _,relative in core.iter_source_files(source)]
            self.assertEqual(set(default_names),{'cache/inside.py','keep.py','skip.log'})
            rules=FilterRules.from_config({
                'ignoredDirectories':['cache'], 'ignoredFiles':[], 'ignoredExtensions':['log'],
            })
            filtered=[relative for _,relative in core.iter_source_files(source,rules)]
            self.assertEqual(filtered,['keep.py'])

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
            result=run_backup([Source('one','Source',str(source))],dest,deep_verify=True)
            self.assertEqual(result.copied_files,1)
            self.assertEqual((dest/'Current'/'Source'/'a').read_text(),'good')

    def test_fast_path_reuses_hash_without_reading_mirror(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); (source/'a').write_text('stable')
            run_backup([Source('one','Source',str(source))],dest)
            with patch.object(core,'sha256_file',side_effect=AssertionError('mirror rehashed')):
                result=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual((result.copied_files,result.unchanged_files),(0,1))

    def test_prepare_file_only_for_changed_candidates(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir()
            unchanged=source/'a'; changed=source/'b'; unchanged.write_text('a'); changed.write_text('b')
            run_backup([Source('one','Source',str(source))],dest)
            changed.write_text('changed-size')
            requested=[]; events=[]
            result=run_backup(
                [Source('one','Source',str(source))],
                dest,
                prepare_file=lambda path: requested.append(path.name) or True,
                progress=events.append,
            )
            self.assertEqual(requested,['b'])
            prepare_events=[event for event in events if event['phase']=='prepare']
            self.assertEqual([(event['completed'],event['total']) for event in prepare_events],[(1,0)])
            self.assertEqual((result.copied_files,result.unchanged_files,result.requested_downloads),(1,1,1))

    def test_deep_verify_repairs_same_size_corruption(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); (source/'a').write_text('good')
            run_backup([Source('one','Source',str(source))],dest)
            mirror=dest/'Current'/'Source'/'a'; mirror.write_text('evil')
            fast=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual((fast.copied_files,fast.unchanged_files),(0,1))
            repaired=run_backup([Source('one','Source',str(source))],dest,deep_verify=True)
            self.assertEqual(repaired.copied_files,1)
            self.assertEqual(mirror.read_text(),'good')

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

    def test_interruption_resumes_completed_file_without_reading_source_again(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir()
            (source/'a').write_text('already cached'); (source/'b').write_text('interrupt here')
            original=core._copy_and_hash
            def interrupt_second(path,target,should_cancel=None):
                if path.name == 'b': raise BackupError('interrupted')
                return original(path,target,should_cancel)
            with patch.object(core,'_copy_and_hash',side_effect=interrupt_second):
                with self.assertRaises(BackupError): run_backup([Source('one','Source',str(source))],dest)
            self.assertTrue((dest/'Resume'/'STATE.json').is_file())
            calls=[]
            def record_copy(path,target,should_cancel=None):
                calls.append(path.name); return original(path,target,should_cancel)
            events=[]
            with patch.object(core,'_copy_and_hash',side_effect=record_copy):
                result=run_backup([Source('one','Source',str(source))],dest,progress=events.append)
            self.assertEqual(calls,['b'])
            self.assertEqual(result.resumed_files,1)
            self.assertTrue(any(e.get('resumed') is True for e in events if e['phase']=='mirror'))

    def test_partial_resume_file_is_never_reused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); item=source/'a'; item.write_text('complete')
            resume=dest/'Resume'; key=core._resume_key('one','a'); cache=core._resume_cache_path(resume,key)
            cache.parent.mkdir(parents=True); (cache.with_name(cache.name+'.part')).write_text('part')
            core._save_resume(resume,{'schemaVersion':core.SCHEMA_VERSION,'files':{key:{'sourceId':'one','path':'a','size':item.stat().st_size,'mtimeNs':item.stat().st_mtime_ns,'sha256':'invalid'}}})
            with patch.object(core,'_copy_and_hash',wraps=core._copy_and_hash) as copier:
                result=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual(copier.call_count,1)
            self.assertEqual(result.resumed_files,0)
            self.assertEqual((dest/'Current'/'Source'/'a').read_text(),'complete')

    def test_changed_metadata_invalidates_resume_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); item=source/'a'; item.write_text('old'); (source/'b').write_text('b')
            with patch.object(core,'_save_resume',wraps=core._save_resume) as saver:
                with self.assertRaises(BackupError):
                    run_backup([Source('one','Source',str(source))],dest,should_cancel=lambda: saver.call_count > 0)
            item.write_text('new content with different size')
            with patch.object(core,'_copy_and_hash',wraps=core._copy_and_hash) as copier:
                result=run_backup([Source('one','Source',str(source))],dest)
            self.assertIn('a',[call.args[0].name for call in copier.call_args_list])
            self.assertEqual(result.resumed_files,0)
            self.assertEqual((dest/'Current'/'Source'/'a').read_text(),'new content with different size')

    def test_resume_cache_is_removed_only_after_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; dest=root/'backup'; source.mkdir(); (source/'a').write_text('a'); (source/'b').write_text('b')
            with patch.object(core,'_save_resume',wraps=core._save_resume) as saver:
                with self.assertRaises(BackupError):
                    run_backup([Source('one','Source',str(source))],dest,should_cancel=lambda: saver.call_count > 0)
            self.assertTrue((dest/'Resume'/'STATE.json').is_file())
            result=run_backup([Source('one','Source',str(source))],dest)
            self.assertEqual(result.resumed_files,1)
            self.assertFalse((dest/'Resume').exists())

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
