import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

export class VerificationError extends Error {}

export class MemoryAttemptJournal {
  #rows = [];
  async append(row) { this.#rows.push(structuredClone(row)); }
  async list() { return structuredClone(this.#rows); }
}

export class DriveAdapter {
  constructor({ client, journal, chunkSize = 256 * 1024, now = () => new Date() }) {
    if (!client || !journal) throw new TypeError('client and journal are required');
    this.client = client;
    this.journal = journal;
    this.chunkSize = chunkSize;
    this.now = now;
  }

  async upload({ idempotencyKey, name, size, sha256, openStream, mimeType = 'application/octet-stream' }) {
    if (!idempotencyKey || !name || !Number.isSafeInteger(size) || size < 0 || !/^[a-f0-9]{64}$/i.test(sha256))
      throw new TypeError('invalid upload manifest');
    const manifest = { idempotencyKey, name, size, sha256: sha256.toLowerCase() };
    const prior = await this.client.findPrivateFile({ idempotencyKey });
    if (prior) {
      try {
        const verified = await this.#verify(prior.id, manifest);
        await this.#log(manifest, 'idempotent_verified', { fileId: prior.id });
        return { ...verified, reused: true };
      } catch (error) {
        await this.#log(manifest, 'stale_remote', { fileId: prior.id, error: error.message });
        await this.client.deleteFile(prior.id);
      }
    }

    let session = await this.client.findResumableSession({ idempotencyKey });
    if (!session) {
      session = await this.client.createResumableSession({
        name, size, mimeType,
        visibility: 'private',
        appProperties: { idempotencyKey, sha256: manifest.sha256 }
      });
      await this.#log(manifest, 'session_created', { sessionId: session.id });
    } else {
      await this.#log(manifest, 'session_resumed', { sessionId: session.id, offset: session.offset });
    }

    try {
      const stream = await openStream(session.offset);
      let offset = session.offset;
      for await (const chunk of fixedChunks(stream, this.chunkSize)) {
        const result = await this.client.uploadChunk(session.id, { offset, chunk, totalSize: size });
        offset = result.offset;
        await this.#log(manifest, 'chunk_uploaded', { sessionId: session.id, offset });
      }
      if (offset !== size) throw new VerificationError(`uploaded size ${offset}, expected ${size}`);
      const fileId = (await this.client.finishResumableSession(session.id)).fileId;
      const verified = await this.#verify(fileId, manifest);
      await this.#log(manifest, 'verified', { fileId, drive_verified_at: verified.drive_verified_at });
      return { ...verified, reused: false };
    } catch (error) {
      await this.#log(manifest, 'failed', { sessionId: session.id, error: error.message });
      throw error;
    }
  }

  async #verify(fileId, manifest) {
    const metadata = await this.client.getFileMetadata(fileId);
    if (!metadata || metadata.trashed || metadata.size !== manifest.size || metadata.visibility !== 'private')
      throw new VerificationError('remote presence, size, or privacy check failed');
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of await this.client.downloadFile(fileId)) { hash.update(chunk); bytes += chunk.length; }
    if (bytes !== manifest.size || hash.digest('hex') !== manifest.sha256)
      throw new VerificationError('remote SHA-256 verification failed');
    return { fileId, size: bytes, sha256: manifest.sha256, drive_verified_at: this.now().toISOString() };
  }

  async #log(manifest, event, detail = {}) {
    await this.journal.append({ at: this.now().toISOString(), idempotencyKey: manifest.idempotencyKey, event, ...detail });
  }
}

async function* fixedChunks(stream, chunkSize) {
  let pending = Buffer.alloc(0);
  for await (const value of stream) {
    pending = Buffer.concat([pending, Buffer.from(value)]);
    while (pending.length >= chunkSize) { yield pending.subarray(0, chunkSize); pending = pending.subarray(chunkSize); }
  }
  if (pending.length) yield pending;
}

export function streamFrom(buffer, offset = 0) { return Readable.from([buffer.subarray(offset)]); }
