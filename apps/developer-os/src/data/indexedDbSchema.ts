import type { IDBPDatabase } from "idb";

export const DB_VERSION = 3;
export const PROJECTS_STORE = "projects";
export const CODEX_CONVERSATIONS_STORE = "codexConversations";
export const CONVERSATION_RUNS_STORE = "conversation-runs";

export function ensureDeveloperOsStores(db: IDBPDatabase<unknown>): void {
  if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
    const projects = db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
    projects.createIndex("updatedAt", "updatedAt");
  }

  if (!db.objectStoreNames.contains(CODEX_CONVERSATIONS_STORE)) {
    const conversations = db.createObjectStore(CODEX_CONVERSATIONS_STORE, {
      keyPath: "id",
    });
    conversations.createIndex("updatedAt", "updatedAt");
    conversations.createIndex("status", "status");
  }

  if (!db.objectStoreNames.contains(CONVERSATION_RUNS_STORE)) {
    const runs = db.createObjectStore(CONVERSATION_RUNS_STORE, {
      keyPath: "run_id",
    });
    runs.createIndex("updated_at", "updated_at");
  }
}
