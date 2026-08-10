import { Readable } from 'node:stream';

export class FakeDriveClient {
  files = new Map(); sessions = new Map(); next = 1; failAfterChunks = Infinity; uploadedChunks = 0;
  async findPrivateFile({ idempotencyKey }) { return [...this.files.values()].find(f => f.appProperties.idempotencyKey === idempotencyKey); }
  async findResumableSession({ idempotencyKey }) { return [...this.sessions.values()].find(s => s.appProperties.idempotencyKey === idempotencyKey && !s.finished); }
  async createResumableSession(meta) { const s = { id: `s${this.next++}`, offset: 0, data: Buffer.alloc(0), ...meta }; this.sessions.set(s.id, s); return s; }
  async uploadChunk(id, { offset, chunk }) {
    if (++this.uploadedChunks > this.failAfterChunks) throw new Error('simulated interruption');
    const s = this.sessions.get(id); if (offset !== s.offset) throw new Error('offset mismatch');
    s.data = Buffer.concat([s.data, chunk]); s.offset = s.data.length; return { offset: s.offset };
  }
  async finishResumableSession(id) {
    const s = this.sessions.get(id); s.finished = true; const fileId = `f${this.next++}`;
    this.files.set(fileId, { id: fileId, size: s.data.length, data: s.data, visibility: s.visibility, appProperties: s.appProperties, trashed: false });
    return { fileId };
  }
  async getFileMetadata(id) { const { data, ...meta } = this.files.get(id) ?? {}; return meta.id ? meta : null; }
  async downloadFile(id) { return Readable.from([this.files.get(id).data]); }
  async deleteFile(id) { this.files.delete(id); }
}
