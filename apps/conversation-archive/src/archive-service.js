import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { FileCollector } from "./collector.js";
import { ConversationJournal } from "./journal.js";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export class ArchiveService {
  constructor({ rootDir, fetchImpl = globalThis.fetch, now = () => new Date(), collectorOptions = {} }) {
    if (!rootDir) throw new TypeError("rootDir is required");
    this.rootDir = rootDir;
    this.journal = new ConversationJournal({ rootDir, now });
    this.collector = new FileCollector({ rootDir, fetchImpl, now, ...collectorOptions });
  }

  startSession(input) {
    return this.journal.start(input);
  }

  appendEvents(input) {
    return this.journal.append(input);
  }

  captureAttachment(input) {
    return this.collector.collect(input);
  }

  finalizeSession(input) {
    return this.journal.finalize(input);
  }

  markReplica(sourceId, status) {
    return this.collector.setDriveStatus(sourceId, status);
  }

  purgeVerified(input) {
    return this.collector.purgeVerified(input);
  }

  async status(sessionId) {
    const paths = this.journal.pathsFor(sessionId);
    const manifest = await readJson(paths.manifestPath);
    const events = await readJson(paths.eventsPath);
    const sourceIds = [...new Set(events.flatMap((event) => event.attachmentSourceIds || []))];
    const attachments = [];
    for (const sourceId of sourceIds) {
      const metadataPath = this.collector.pathsFor(sourceId).metadataPath;
      try {
        attachments.push(await readJson(metadataPath));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        attachments.push({ sourceId, status: "not_detected" });
      }
    }
    const counts = Object.fromEntries(
      [...new Set(attachments.map((item) => item.status))]
        .map((status) => [status, attachments.filter((item) => item.status === status).length])
    );
    const complete = manifest.status === "ready_for_replication" && attachments.every(
      (item) => item.status === "drive_verified"
    );
    return {
      sessionId,
      status: complete ? "complete" : manifest.status,
      eventCount: events.length,
      attachmentCount: attachments.length,
      attachmentStatuses: counts,
      complete,
      blockers: attachments
        .filter((item) => item.status !== "drive_verified")
        .map((item) => ({ sourceId: item.sourceId, status: item.status }))
    };
  }
}
