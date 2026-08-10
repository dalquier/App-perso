export const TOOL_DEFINITIONS = [
  {
    name: "start_session",
    description: "Start an idempotent conversation archive session.",
    inputSchema: {
      type: "object", additionalProperties: false,
      required: ["session_id", "source"],
      properties: {
        session_id: { type: "string", minLength: 3 },
        source: { type: "string", minLength: 1 },
        title: { type: ["string", "null"] }
      }
    }
  },
  {
    name: "append_events",
    description: "Append ordered conversation events; duplicate event IDs are ignored.",
    inputSchema: {
      type: "object", additionalProperties: false,
      required: ["session_id", "events"],
      properties: {
        session_id: { type: "string" },
        events: {
          type: "array", minItems: 1,
          items: {
            type: "object", required: ["role", "content"], additionalProperties: false,
            properties: {
              event_id: { type: "string" },
              role: { enum: ["user", "assistant", "tool", "system"] },
              content: { type: "string" },
              created_at: { type: "string" },
              attachment_file_ids: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
  },
  {
    name: "capture_attachment",
    description: "Immediately buffer attachment bytes using a stable file_id and renewable download_url.",
    inputSchema: {
      type: "object", additionalProperties: false,
      required: ["file_id", "download_url"],
      properties: {
        file_id: { type: "string", minLength: 1 },
        download_url: { type: "string", format: "uri" },
        filename: { type: "string" },
        expected_mime: { type: "string" },
        allowed_mime_types: { type: "array", items: { type: "string" } },
        max_bytes: { type: "integer", minimum: 1 }
      }
    }
  },
  {
    name: "finalize_session",
    description: "Finalize capture and mark a session ready for replication.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["session_id"],
      properties: { session_id: { type: "string" } }
    }
  },
  {
    name: "status",
    description: "Read current session and attachment archive status.",
    inputSchema: {
      type: "object", additionalProperties: false,
      properties: {
        session_id: { type: "string" },
        file_ids: { type: "array", items: { type: "string" } }
      }
    }
  }
];
