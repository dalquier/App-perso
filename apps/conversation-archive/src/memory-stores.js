export class InMemoryJobStore {
  jobs = new Map();

  async enqueue(job) {
    if (job.dedupeKey) {
      const existing = [...this.jobs.values()].find(x => x.dedupeKey === job.dedupeKey && ['pending', 'leased'].includes(x.state));
      if (existing) return structuredClone(existing);
    }
    if (this.jobs.has(job.id)) throw new Error('duplicate job id');
    this.jobs.set(job.id, structuredClone(job));
    return structuredClone(job);
  }

  async claimDue({ now, workerId, leaseUntil, limit }) {
    const due = [...this.jobs.values()]
      .filter(j => (j.state === 'pending' && j.runAt <= now) || (j.state === 'leased' && j.leaseUntil <= now))
      .sort((a, b) => a.runAt - b.runAt || a.id.localeCompare(b.id))
      .slice(0, limit);
    for (const job of due) Object.assign(job, { state: 'leased', leaseOwner: workerId, leaseUntil });
    return structuredClone(due);
  }

  #owned(id, owner) {
    const job = this.jobs.get(id);
    if (!job || job.state !== 'leased' || job.leaseOwner !== owner) throw new Error('lease lost');
    return job;
  }
  async complete(id, owner) { Object.assign(this.#owned(id, owner), { state: 'completed', leaseOwner: undefined, leaseUntil: undefined }); }
  async retry(id, owner, attempts, runAt, lastError) { Object.assign(this.#owned(id, owner), { state: 'pending', attempts, runAt, lastError, leaseOwner: undefined, leaseUntil: undefined }); }
  async failPermanently(id, owner, attempts, lastError) { Object.assign(this.#owned(id, owner), { state: 'dead', attempts, lastError, leaseOwner: undefined, leaseUntil: undefined }); }
}

export class InMemoryLeaseStore {
  leases = new Map();
  async acquire(key, owner, until, now) {
    const lease = this.leases.get(key);
    if (lease && lease.until > now && lease.owner !== owner) return false;
    this.leases.set(key, { owner, until });
    return true;
  }
  async release(key, owner) {
    if (this.leases.get(key)?.owner === owner) this.leases.delete(key);
  }
}

export class InMemoryAuditStore {
  records = [];
  async append(record) { this.records.push(structuredClone(record)); }
}
