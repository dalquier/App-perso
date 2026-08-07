import hashlib
import hmac
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
from urllib.parse import parse_qs, urlsplit

from projectos_backup.drive_client import (
    AppsScriptClient, DriveSyncError, MAX_BATCH_FILES, MAX_BATCH_RAW_BYTES, STATE_DIRECTORY, STATE_FILE,
    drive_state_path, format_preflight_diagnostic, has_pending_drive_sync, manifest_files,
    normalize_apps_script_url, preflight_drive, sync_current,
)
from projectos_backup import drive_client


def manifest(records, run_id="run-new"):
    return {
        "status": "complete", "runId": run_id, "fileCount": len(records),
        "sources": [{"folder": "Pyto", "files": records}],
    }


class FakeClient:
    def __init__(self, remote=None, lose_upload_response=False, fail_action=None):
        self.remote = remote or manifest([], "run-old")
        self.verified = None
        self.calls = []
        self.received_uploads = {}
        self.received_deletes = set()
        self.lose_upload_response = lose_upload_response
        self.lost_once = False
        self.fail_action = fail_action

    def public_read(self, timeout=None):
        self.calls.append(("wake", {"timeout": timeout}))
        return {"ok": True, "service": "ProjectOS Backup", "protocol": 2}

    def call(self, action, **payload):
        self.calls.append((action, payload))
        if action == self.fail_action:
            raise DriveSyncError("échec")
        if action == "manifest":
            return {"manifest": self.verified if self.verified is not None else self.remote}
        if action == "beginSync":
            return {
                "receivedUploads": len(self.received_uploads),
                "receivedDeletes": len(self.received_deletes),
            }
        if action == "syncStatus":
            return {
                "receivedUploads": [
                    item["path"] for item in payload.get("uploads", [])
                    if self.received_uploads.get(item["path"]) == item["sha256"]
                ],
                "receivedDeletes": [path for path in payload.get("deletes", []) if path in self.received_deletes],
            }
        if action == "uploadBatch":
            for item in payload["files"]:
                self.received_uploads[item["path"]] = item["sha256"]
            if self.lose_upload_response and not self.lost_once:
                self.lost_once = True
                raise DriveSyncError("Google Drive — uploadBatch : timed out")
            return {"resumed": 0}
        if action == "deleteBatch":
            self.received_deletes.update(payload["paths"])
            return {"resumed": 0}
        if action == "finalizeSync":
            self.verified = payload["manifest"]
            return {"status": "complete"}
        return {}

    def read(self, action, **payload):
        payload.pop("timeout", None)
        if action == "health":
            self.calls.append((action, payload))
            return {"ok": True, "service": "ProjectOS Backup", "protocol": 2, "rootReady": True}
        return self.call(action, **payload)


class ScriptedPreflightClient:
    def __init__(self, wake=None, health=None, manifests=None):
        self.wake = list(wake or [{"ok": True, "service": "ProjectOS Backup", "protocol": 2}])
        self.health = list(health or [{"ok": True, "protocol": 2, "rootReady": True}])
        self.manifests = list(manifests or [None])
        self.calls = []

    @staticmethod
    def _next(values):
        value = values.pop(0) if len(values) > 1 else values[0]
        if isinstance(value, Exception):
            raise value
        return value

    def public_read(self, timeout=None):
        self.calls.append("wake")
        return self._next(self.wake)

    def read(self, action, **payload):
        self.calls.append(action)
        if action == "health":
            return self._next(self.health)
        if action == "manifest":
            return {"ok": True, "manifest": self._next(self.manifests)}
        raise AssertionError(f"unexpected read: {action}")


def prepare(current, files, remote=None):
    records = []
    (current / "Pyto").mkdir()
    for name, data in files:
        (current / "Pyto" / name).write_bytes(data)
        records.append({"path": name, "sha256": hashlib.sha256(data).hexdigest()})
    local = manifest(records)
    (current / "MANIFEST.json").write_text(json.dumps(local), encoding="utf-8")
    return local, FakeClient(remote)


class DriveClientTests(unittest.TestCase):
    def test_preflight_accepts_empty_first_backup_without_mutation(self):
        client = ScriptedPreflightClient(manifests=[None])
        events = []
        result = preflight_drive(client, progress=events.append, sleep=lambda _: None)
        self.assertEqual(result["status"], "ready")
        self.assertFalse(result["hasManifest"])
        self.assertEqual(client.calls, ["wake", "health", "manifest"])
        self.assertEqual([event["phase"] for event in events], [
            "drive_wake", "drive_auth", "drive_manifest", "drive_ready",
        ])

    def test_preflight_retries_transient_failure_with_backoff(self):
        transient = DriveSyncError("timeout", code="network", stage="wake", retryable=True)
        client = ScriptedPreflightClient(wake=[transient, {"ok": True, "service": "ProjectOS Backup", "protocol": 2}])
        sleeps = []
        result = preflight_drive(client, sleep=sleeps.append)
        self.assertEqual(result["attempt"], 2)
        self.assertEqual(sleeps, [2])
        self.assertEqual(client.calls, ["wake", "wake", "health", "manifest"])

    def test_preflight_auth_failure_is_not_retried(self):
        denied = DriveSyncError("Accès refusé", code="auth", stage="health", retryable=False)
        client = ScriptedPreflightClient(health=[denied])
        with self.assertRaises(DriveSyncError) as raised:
            preflight_drive(client, sleep=lambda _: self.fail("must not sleep"))
        self.assertEqual(raised.exception.code, "auth")
        self.assertEqual(client.calls, ["wake", "health"])

    def test_preflight_rejects_malformed_protocol_without_retry(self):
        client = ScriptedPreflightClient(wake=[{"ok": True, "service": "ProjectOS Backup", "protocol": "invalid"}])
        with self.assertRaises(DriveSyncError) as raised:
            preflight_drive(client, sleep=lambda _: self.fail("must not sleep"))
        self.assertEqual(raised.exception.code, "protocol")
        self.assertEqual(client.calls, ["wake"])

    def test_preflight_rejects_invalid_manifest_without_mutation(self):
        client = ScriptedPreflightClient(manifests=[{"status": "running"}])
        with self.assertRaisesRegex(DriveSyncError, "incomplet"):
            preflight_drive(client, sleep=lambda _: None)
        self.assertEqual(client.calls, ["wake", "health", "manifest"])

    def test_sync_never_mutates_drive_when_preflight_fails(self):
        class OfflineClient(FakeClient):
            def public_read(self, timeout=None):
                self.calls.append(("wake", {}))
                raise DriveSyncError("hors ligne", code="network", stage="wake", retryable=True)

        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            prepare(current, [("a", b"x")])
            client = OfflineClient()
            with mock.patch("projectos_backup.drive_client.time.sleep"):
                with self.assertRaisesRegex(DriveSyncError, "hors ligne"):
                    sync_current(current, client)
            actions = [action for action, _ in client.calls]
            self.assertEqual(actions, ["wake", "wake", "wake"])
            self.assertFalse(set(actions) & {"beginSync", "uploadBatch", "deleteBatch", "finalizeSync"})

    def test_apps_script_manifest_preflight_does_not_create_current(self):
        code = (Path(__file__).parents[1] / "apps-script" / "Code.gs").read_text(encoding="utf-8")
        do_get = code.split("function doGet(e)", 1)[1].split("function secureEquals_", 1)[0]
        self.assertIn("findChildFolder_(root, 'Current')", do_get)
        self.assertNotIn("childFolder_(root, 'Current')", do_get)

    def test_diagnostic_masks_signed_url_and_contains_stage(self):
        error = DriveSyncError(
            "échec https://script.google.com/macros/s/id/exec?action=health&signature=secret",
            code="network", stage="health", retryable=True, attempt=2,
        )
        diagnostic = format_preflight_diagnostic(error)
        self.assertIn('"stage": "health"', diagnostic)
        self.assertIn("[URL signée masquée]", diagnostic)
        self.assertNotIn("signature=secret", diagnostic)

    def test_normalizes_google_copy_artifacts(self):
        raw = "  “https://script.google.com/macros/s/AKfy-test_123/exec/?authuser=0”  "
        self.assertEqual(normalize_apps_script_url(raw), "https://script.google.com/macros/s/AKfy-test_123/exec")

    def test_rejects_wrong_relay_host(self):
        with self.assertRaises(ValueError):
            normalize_apps_script_url("https://example.com/macros/s/id/exec")

    def test_manifest_files_prefixes_source_folder(self):
        self.assertEqual(list(manifest_files(manifest([{"path": "a.py"}]))), ["Pyto/a.py"])

    def test_control_read_uses_authenticated_get(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self): return b'{"ok":true,"manifest":null}'

        client = AppsScriptClient(
            "https://script.google.com/macros/s/AKfy-test_123/exec",
            "x" * 24,
        )
        with mock.patch("urllib.request.urlopen", return_value=Response()) as opened:
            result = client.read("manifest")
        request = opened.call_args.args[0]
        query = parse_qs(urlsplit(request.full_url).query)
        self.assertEqual(request.method, "GET")
        self.assertEqual(query["action"], ["manifest"])
        self.assertNotIn("token", query)
        message = f"manifest\n{query['timestamp'][0]}\n{query['payload'][0]}".encode("utf-8")
        expected = hmac.new(("x" * 24).encode("utf-8"), message, hashlib.sha256).hexdigest()
        self.assertEqual(query["signature"], [expected])
        self.assertIsNone(result["manifest"])

    def test_control_read_rejects_empty_response(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self): return b""

        client = AppsScriptClient(
            "https://script.google.com/macros/s/AKfy-test_123/exec",
            "x" * 24,
        )
        with mock.patch("urllib.request.urlopen", return_value=Response()):
            with self.assertRaisesRegex(DriveSyncError, "réponse vide"):
                client.read("manifest")

    def test_small_batches_finalize_and_verify(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            files = [(f"f{i}.txt", str(i).encode()) for i in range(MAX_BATCH_FILES + 1)]
            _, client = prepare(current, files)
            result = sync_current(current, client)
            upload_calls = [payload for action, payload in client.calls if action == "uploadBatch"]
            self.assertEqual([len(call["files"]) for call in upload_calls], [MAX_BATCH_FILES, 1])
            self.assertEqual(result["verified_files"], len(files))
            self.assertIn("finalizeSync", [action for action, _ in client.calls])

    def test_partitions_on_raw_byte_limit(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            block = b"x" * (MAX_BATCH_RAW_BYTES // 2 + 1)
            _, client = prepare(current, [("a.bin", block), ("b.bin", block)])
            sync_current(current, client)
            uploads = [payload for action, payload in client.calls if action == "uploadBatch"]
            self.assertEqual([len(item["files"]) for item in uploads], [1, 1])

    def test_first_upload_batch_is_encoded_lazily(self):
        changed = [f"Pyto/f{i}.txt" for i in range(MAX_BATCH_FILES + 3)]
        records = {path: {"sha256": "x"} for path in changed}
        encoded = []

        def fake_payload(current, path, record):
            encoded.append(path)
            return {"path": path, "sha256": "x", "contentBase64": ""}, 1

        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw)
            (current / "Pyto").mkdir()
            for path in changed:
                (current / path).write_bytes(b"x")
            with mock.patch.object(drive_client, "_upload_payload", side_effect=fake_payload):
                batches = drive_client._iter_upload_batches(current, changed, records)
                first = next(batches)
        self.assertEqual(len(first), MAX_BATCH_FILES)
        self.assertEqual(len(encoded), MAX_BATCH_FILES)

    def test_lost_response_is_confirmed_without_second_upload(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            _, client = prepare(current, [("a", b"x"), ("b", b"y")])
            client.lose_upload_response = True
            result = sync_current(current, client)
            self.assertEqual(len([1 for action, _ in client.calls if action == "uploadBatch"]), 1)
            self.assertEqual(result["resumed_files"], 2)
            self.assertEqual(result["status"], "complete")

    def test_existing_server_receipts_are_resumed(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            local, client = prepare(current, [("a", b"x")])
            sha = local["sources"][0]["files"][0]["sha256"]
            client.received_uploads["Pyto/a"] = sha
            result = sync_current(current, client)
            self.assertFalse(any(action == "uploadBatch" for action, _ in client.calls))
            self.assertEqual(result["resumed_files"], 1)

    def test_deletes_follow_uploads(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            old = manifest([{"path": "old", "sha256": "z"}], "old")
            _, client = prepare(current, [("new", b"x")], old)
            sync_current(current, client)
            actions = [action for action, _ in client.calls]
            self.assertLess(actions.index("uploadBatch"), actions.index("deleteBatch"))
            self.assertLess(actions.index("deleteBatch"), actions.index("finalizeSync"))

    def test_failed_upload_never_deletes_or_finalizes_and_persists_state(self):
        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            _, client = prepare(current, [("a", b"x")], manifest([{"path": "old", "sha256": "z"}], "old"))
            client.fail_action = "uploadBatch"
            with self.assertRaises(DriveSyncError):
                sync_current(current, client)
            actions = [action for action, _ in client.calls]
            self.assertNotIn("deleteBatch", actions)
            self.assertNotIn("finalizeSync", actions)
            state = json.loads((current.parent / STATE_DIRECTORY / STATE_FILE).read_text(encoding="utf-8"))
            self.assertEqual(state["status"], "interrupted")
            self.assertEqual(drive_state_path(current), current.parent / STATE_DIRECTORY / STATE_FILE)
            self.assertTrue(has_pending_drive_sync(current))

    def test_manifest_mismatch_fails_after_finalize(self):
        class MismatchClient(FakeClient):
            def call(self, action, **payload):
                result = super().call(action, **payload)
                if action == "finalizeSync":
                    self.verified = json.loads(json.dumps(payload["manifest"]))
                    self.verified["sources"][0]["files"][0]["sha256"] = "incorrect"
                return result

        with tempfile.TemporaryDirectory() as raw:
            current = Path(raw) / "Current"
            current.mkdir()
            local, _ = prepare(current, [("a", b"x")])
            client = MismatchClient()
            with self.assertRaisesRegex(DriveSyncError, "ne correspond pas"):
                sync_current(current, client)
            self.assertEqual(client.verified["runId"], local["runId"])


if __name__ == "__main__":
    unittest.main()
