import { randomUUID } from 'node:crypto';

const DAY_MS = 86_400_000;

export class RetryScheduler {
  constructor({ store, handler, clock = () => new Date(), random = Math.random, baseDelayMs = 1_000, maxDelayMs = 3_600_000, leaseMs = 60_000, maxAttempts = 8 }) {
    Object.assign(this, { store, handler, clock, random, baseDelayMs, maxDelayMs, leaseMs, maxAttempts });
  }

  async enqueue(payload, { id = randomUUID(), runAt = this.clock(), dedupeKey } = {}) {
    return this.store.enqueue({ id, payload, runAt: new Date(runAt), dedupeKey, attempts: 0, state: 'pending' });
  }

  async runOnce({ workerId, limit = 10 } = {}) {
    if (!workerId) throw new Error('workerId is required');
    const now = this.clock();
    const jobs = await this.store.claimDue({ now, workerId, leaseUntil: new Date(now.getTime() + this.leaseMs), limit });
    const results = [];
    for (const job of jobs) {
      try {
        await this.handler(job.payload, { jobId: job.id, attempt: job.attempts + 1 });
        await this.store.complete(job.id, workerId);
        results.push({ id: job.id, state: 'completed' });
      } catch (error) {
        const attempts = job.attempts + 1;
        if (attempts >= this.maxAttempts) {
          await this.store.failPermanently(job.id, workerId, attempts, safeError(error));
          results.push({ id: job.id, state: 'dead' });
        } else {
          const cap = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** (attempts - 1));
          const delay = Math.floor(cap / 2 + this.random() * cap / 2);
          await this.store.retry(job.id, workerId, attempts, new Date(this.clock().getTime() + delay), safeError(error));
          results.push({ id: job.id, state: 'pending', delayMs: delay });
        }
      }
    }
    return results;
  }
}

export class DailyPurgeScheduler {
  constructor({ repository, auditStore, leaseStore, clock = () => new Date(), retentionDays = 30, leaseMs = 3_600_000, batchSize = 100 }) {
    Object.assign(this, { repository, auditStore, leaseStore, clock, retentionDays, leaseMs, batchSize });
  }

  async run({ workerId, dryRun = false } = {}) {
    if (!workerId) throw new Error('workerId is required');
    const startedAt = this.clock();
    const day = startedAt.toISOString().slice(0, 10);
    const acquired = await this.leaseStore.acquire(`daily-purge:${day}`, workerId, new Date(startedAt.getTime() + this.leaseMs), startedAt);
    if (!acquired) return { acquired: false, examined: 0, purged: 0 };

    const cutoff = new Date(startedAt.getTime() - this.retentionDays * DAY_MS);
    let cursor;
    let examined = 0;
    let purged = 0;
    try {
      do {
        const page = await this.repository.listPurgeCandidates({ cutoff, cursor, limit: this.batchSize });
        for (const item of page.items) {
          examined++;
          // Defense in depth: the scheduler itself enforces the eligibility invariant.
          if (!item.drive_verified_at || new Date(item.drive_verified_at) > cutoff) continue;
          let outcome = dryRun ? 'dry_run' : 'purged';
          let error;
          try {
            if (!dryRun) {
              await this.repository.purge(item.id);
              purged++;
            }
          } catch (cause) {
            outcome = 'failed';
            error = safeError(cause);
          }
          await this.auditStore.append({
            id: randomUUID(), itemId: item.id, outcome, dryRun,
            driveVerifiedAt: new Date(item.drive_verified_at), cutoff,
            occurredAt: this.clock(), error
          });
        }
        cursor = page.nextCursor;
      } while (cursor);
      return { acquired: true, examined, purged, cutoff };
    } finally {
      await this.leaseStore.release(`daily-purge:${day}`, workerId);
    }
  }
}

function safeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n]/g, ' ').slice(0, 500);
}
