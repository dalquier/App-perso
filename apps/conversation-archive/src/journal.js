import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWriteJson } from "./atomic.js";

const ROLES = new Set(["user", "assistant", "tool", "system"]);

async function load(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function safeSessionId(value) {
  if (!/^[A-Z0-9][A-Z0-9._-]{2,127}$/i.test(value)) {
    throw new TypeError("sessionId must be a stable safe identifier");
  }
  return value;
}

export class ConversationJournal {
  constructor({ rootDir, now = () => new Date() }) {
    if (!rootDir) throw new TypeError("rootDir is required");
    this.rootDir = rootDir;
    this.now = now;
  }

  pathsFor(sessionId) {
    const id = safeSessionId(sessionId);
    const sessionDir = join(this.rootDir, "sessions", id);
    return {
      sessionDir,
      manifestPath: join(sessionDir, "manifest.json"),
      eventsPath: join(sessionDir, "events.json")
    };
  }

  async start({ sessionId, source, title = null }) {
    const paths = this.pathsFor(sessionId);
    await mkdir(paths.sessionDir, { recursive: true });
    const existing = await load(paths.manifestPath, null);
    if (existing) return { ...existing, idempotentHit: true };
    const timestamp = this.now().toISOString();
    const manifest = {
      schemaVersion: "2.0-draft",
      sessionId,
      source,
      title,
      status: "capturing",
      createdAt: timestamp,
      updatedAt: timestamp,
      eventCount: 0,
      retention: {
        stagingDays: 30,
        startsAt: "drive_verified_at",
        finalDriveArchiveDeleted: false
      }
    };
    await atomicWriteJson(paths.manifestPath, manifest);
    await atomicWriteJson(paths.eventsPath, []);
    return manifest;
  }

  async append({ sessionId, events }) {
    if (!Array.isArray(events) || events.length === 0) throw new TypeError("events are required");
    const paths = this.pathsFor(sessionId);
    const manifest = await load(paths.manifestPath, null);
    if (!manifest) throw new Error("Session does not exist");
    if (manifest.status !== "capturing") throw new Error("Session is not capturing");
    const current = await load(paths.eventsPath, []);
    const known = new Set(current.map((event) => event.eventId));
    let inserted = 0;
    for (const input of events) {
      if (!ROLES.has(input.role)) throw new TypeError(`Invalid event role: ${input.role}`);
      const eventId = input.eventId || randomUUID();
      if (known.has(eventId)) continue;
      current.push({
        eventId,
        sequence: current.length + 1,
        role: input.role,
        content: String(input.content ?? ""),
        createdAt: input.createdAt || this.now().toISOString(),
        attachmentSourceIds: [...new Set(input.attachmentSourceIds || [])]
      });
      known.add(eventId);
      inserted += 1;
    }
    await atomicWriteJson(paths.eventsPath, current);
    const updated = {
      ...manifest,
      eventCount: current.length,
      updatedAt: this.now().toISOString()
    };
    await atomicWriteJson(paths.manifestPath, updated);
    return { inserted, total: current.length };
  }

  async finalize({ sessionId }) {
    const paths = this.pathsFor(sessionId);
    const manifest = await load(paths.manifestPath, null);
    if (!manifest) throw new Error("Session does not exist");
    const updated = {
      ...manifest,
      status: "ready_for_replication",
      finalizedAt: manifest.finalizedAt || this.now().toISOString(),
      updatedAt: this.now().toISOString()
    };
    await atomicWriteJson(paths.manifestPath, updated);
    return updated;
  }
}
