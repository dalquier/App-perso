import test from 'node:test';
import assert from 'node:assert/strict';
import { RetryScheduler, DailyPurgeScheduler } from '../src/scheduler.js';
import { InMemoryJobStore, InMemoryLeaseStore, InMemoryAuditStore } from '../src/memory-stores.js';

test('retry uses exponential backoff and eventually completes', async () => {
  let now = new Date('2026-01-01T00:00:00Z');
  let calls = 0;
  const store = new InMemoryJobStore();
  const scheduler = new RetryScheduler({ store, clock: () => now, random: () => 0, baseDelayMs: 1000, handler: async () => { if (++calls === 1) throw new Error('temporary'); } });
  await scheduler.enqueue({ value: 1 }, { id: 'j1' });
  assert.deepEqual(await scheduler.runOnce({ workerId: 'a' }), [{ id: 'j1', state: 'pending', delayMs: 500 }]);
  assert.deepEqual(await scheduler.runOnce({ workerId: 'a' }), []);
  now = new Date(now.getTime() + 500);
  assert.equal((await scheduler.runOnce({ workerId: 'a' }))[0].state, 'completed');
});

test('lease prevents concurrent processing and expired lease is recoverable', async () => {
  let now = new Date('2026-01-01T00:00:00Z');
  const store = new InMemoryJobStore();
  await store.enqueue({ id: 'j1', payload: {}, runAt: now, attempts: 0, state: 'pending' });
  assert.equal((await store.claimDue({ now, workerId: 'a', leaseUntil: new Date(now.getTime() + 1000), limit: 1 })).length, 1);
  assert.equal((await store.claimDue({ now, workerId: 'b', leaseUntil: new Date(now.getTime() + 1000), limit: 1 })).length, 0);
  now = new Date(now.getTime() + 1001);
  assert.equal((await store.claimDue({ now, workerId: 'b', leaseUntil: new Date(now.getTime() + 1000), limit: 1 }))[0].leaseOwner, 'b');
});

test('dedupe key avoids duplicate pending work', async () => {
  const store = new InMemoryJobStore();
  const scheduler = new RetryScheduler({ store, handler: async () => {} });
  const first = await scheduler.enqueue({}, { id: 'one', dedupeKey: 'archive:42' });
  const second = await scheduler.enqueue({}, { id: 'two', dedupeKey: 'archive:42' });
  assert.equal(first.id, second.id);
});

test('purge only deletes drive-verified items at least 30 days old and audits', async () => {
  const purged = [];
  const auditStore = new InMemoryAuditStore();
  const repository = {
    async listPurgeCandidates() { return { items: [
      { id: 'old', drive_verified_at: '2026-01-01T00:00:00Z' },
      { id: 'recent', drive_verified_at: '2026-01-15T00:00:01Z' },
      { id: 'unverified', drive_verified_at: null }
    ] }; },
    async purge(id) { purged.push(id); }
  };
  const scheduler = new DailyPurgeScheduler({ repository, auditStore, leaseStore: new InMemoryLeaseStore(), clock: () => new Date('2026-02-14T00:00:00Z') });
  const result = await scheduler.run({ workerId: 'a' });
  assert.deepEqual(purged, ['old']);
  assert.equal(result.purged, 1);
  assert.equal(auditStore.records.length, 1);
  assert.equal(auditStore.records[0].outcome, 'purged');
});

test('dry-run never purges but writes PurgeRecord audit entries', async () => {
  let calls = 0;
  const auditStore = new InMemoryAuditStore();
  const scheduler = new DailyPurgeScheduler({
    repository: { async listPurgeCandidates() { return { items: [{ id: 'x', drive_verified_at: '2025-01-01T00:00:00Z' }] }; }, async purge() { calls++; } },
    auditStore, leaseStore: new InMemoryLeaseStore(), clock: () => new Date('2026-02-14T00:00:00Z')
  });
  const result = await scheduler.run({ workerId: 'a', dryRun: true });
  assert.equal(calls, 0);
  assert.equal(result.purged, 0);
  assert.equal(auditStore.records[0].outcome, 'dry_run');
});

test('daily lease excludes a concurrent purge', async () => {
  const leaseStore = new InMemoryLeaseStore();
  const now = new Date('2026-02-14T00:00:00Z');
  await leaseStore.acquire('daily-purge:2026-02-14', 'other', new Date(now.getTime() + 1000), now);
  const scheduler = new DailyPurgeScheduler({ repository: {}, auditStore: {}, leaseStore, clock: () => now });
  assert.deepEqual(await scheduler.run({ workerId: 'a' }), { acquired: false, examined: 0, purged: 0 });
});
