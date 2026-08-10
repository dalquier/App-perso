import { readFile } from "node:fs/promises";
import { ConversationJournal } from "./journal.js";
import { FileCollector } from "./collector.js";
import { TOOL_DEFINITIONS } from "./mcp-tools.js";

async function readJson(path) {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function requiredString(value, name) {
  if (typeof value !== "string" || !value) throw new TypeError(`${name} is required`);
  return value;
}

export class ArchiveMcpService {
  constructor({ rootDir, journal, collector, urlResolver } = {}) {
    if (!rootDir && (!journal || !collector)) throw new TypeError("rootDir is required");
    this.journal = journal || new ConversationJournal({ rootDir });
    this.collector = collector || new FileCollector({ rootDir });
    this.urlResolver = urlResolver;
  }

  listTools() { return TOOL_DEFINITIONS; }

  async callTool(name, input = {}) {
    switch (name) {
      case "start_session":
        return this.journal.start({
          sessionId: requiredString(input.session_id, "session_id"),
          source: requiredString(input.source, "source"),
          title: input.title ?? null
        });
      case "append_events":
        return this.journal.append({
          sessionId: requiredString(input.session_id, "session_id"),
          events: (input.events || []).map((event) => ({
            eventId: event.event_id,
            role: event.role,
            content: event.content,
            createdAt: event.created_at,
            attachmentSourceIds: event.attachment_file_ids
          }))
        });
      case "capture_attachment": {
        const fileId = requiredString(input.file_id, "file_id");
        const refreshUrl = this.urlResolver
          ? ({ error }) => this.urlResolver.renew({ fileId, previousUrl: input.download_url, error })
          : undefined;
        return this.collector.collect({
          sourceId: fileId,
          url: requiredString(input.download_url, "download_url"),
          originalName: input.filename,
          expectedMime: input.expected_mime,
          allowedMimeTypes: input.allowed_mime_types,
          maxBytes: input.max_bytes,
          refreshUrl
        });
      }
      case "finalize_session":
        return this.journal.finalize({ sessionId: requiredString(input.session_id, "session_id") });
      case "status":
        return this.#status(input);
      default:
        throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32601 });
    }
  }

  async #status(input) {
    const result = { session: null, attachments: {} };
    if (input.session_id) {
      result.session = await readJson(this.journal.pathsFor(input.session_id).manifestPath);
    }
    for (const fileId of input.file_ids || []) {
      result.attachments[fileId] = await readJson(this.collector.pathsFor(fileId).metadataPath);
    }
    return result;
  }
}
