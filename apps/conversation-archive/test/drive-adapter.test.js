import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DriveAdapter, MemoryAttemptJournal, streamFrom } from '../src/drive-adapter.js';
import { FakeDriveClient } from './fake-drive-client.js';

const digest = b => createHash('sha256').update(b).digest('hex');
const manifest = (data, key = 'archive:42') => ({ idempotencyKey: key, name: 'archive.bin', size: data.length, sha256: digest(data), openStream: offset => streamFrom(data, offset) });

test('uploads privately, verifies remote bytes, and is idempotent', async () => {
  const data = Buffer.from('confidential archive payload'); const client = new FakeDriveClient(); const journal = new MemoryAttemptJournal();
  const adapter = new DriveAdapter({ client, journal, chunkSize: 5, now: () => new Date('2026-08-07T00:00:00Z') });
  const first = await adapter.upload(manifest(data)); const second = await adapter.upload(manifest(data));
  assert.equal(first.reused, false); assert.equal(second.reused, true); assert.equal(first.fileId, second.fileId);
  assert.equal(client.files.get(first.fileId).visibility, 'private'); assert.equal(first.drive_verified_at, '2026-08-07T00:00:00.000Z');
  assert.ok((await journal.list()).some(x => x.event === 'idempotent_verified'));
});

test('resumes at acknowledged offset after interruption', async () => {
  const data = Buffer.from('0123456789abcdef'); const client = new FakeDriveClient(); const journal = new MemoryAttemptJournal();
  const adapter = new DriveAdapter({ client, journal, chunkSize: 4 }); client.failAfterChunks = 2;
  await assert.rejects(adapter.upload(manifest(data, 'resume')), /interruption/);
  const session = [...client.sessions.values()][0]; assert.equal(session.offset, 8);
  client.failAfterChunks = Infinity; const result = await adapter.upload(manifest(data, 'resume'));
  assert.equal(result.size, data.length); assert.ok((await journal.list()).some(x => x.event === 'session_resumed' && x.offset === 8));
});

test('does not stamp verification when remote content is corrupt', async () => {
  const data = Buffer.from('correct'); const client = new FakeDriveClient(); const journal = new MemoryAttemptJournal();
  const originalFinish = client.finishResumableSession.bind(client);
  client.finishResumableSession = async id => { const out = await originalFinish(id); client.files.get(out.fileId).data[0] ^= 1; return out; };
  const adapter = new DriveAdapter({ client, journal, chunkSize: 20 });
  await assert.rejects(adapter.upload(manifest(data, 'corrupt')), /SHA-256/);
  assert.equal((await journal.list()).some(x => x.drive_verified_at), false);
  assert.ok((await journal.list()).some(x => x.event === 'failed'));
});
