import { CONVERSATION_SCHEMA_VERSION, MESSAGE_STATUS } from "../domain/conversation.js";

export const STORAGE_KEY = "equilibre.local.v1";
export const STORAGE_VERSION = 3;
export const BUILD01_BACKUP_KEY = `${STORAGE_KEY}.build01.backup`;

const MIGRATION_EPOCH = "2026-01-01T00:00:00.000Z";

export function defaultState() {
  return {
    version: STORAGE_VERSION,
    settings: { saveLocally: true, theme: "system" },
    conversations: [],
    activeConversationId: null,
    messages: [],
    lastSession: null,
    sessionRecords: [],
    memoryEntries: [],
  };
}

const validDate = (value, fallback = MIGRATION_EPOCH) => {
  const date = value ? new Date(value) : new Date(fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const legacyId = (prefix, index, value = "") =>
  `${prefix}-build01-${index}-${String(value).replace(/[^a-z0-9]+/gi, "-").slice(0, 24) || "item"}`;

const cleanMessage = (message, index) => {
  if (!message || typeof message !== "object") return null;
  const role = message.role === "assistant" ? "assistant" : "user";
  const content = typeof message.content === "string" ? message.content : String(message.content ?? "");
  if (!content.trim()) return null;
  return {
    id: typeof message.id === "string" && message.id ? message.id : legacyId(role, index, content),
    role,
    content,
    createdAt: validDate(message.createdAt),
    status: role === "assistant" ? MESSAGE_STATUS.complete : MESSAGE_STATUS.sent,
    provenance: typeof message.provider === "string" && message.provider ? message.provider : "build-01",
    errorRef: null,
  };
};

export function migrateBuild01(raw = {}) {
  const base = defaultState();
  const messages = (Array.isArray(raw.messages) ? raw.messages : [])
    .map(cleanMessage)
    .filter(Boolean);
  const createdAt = messages[0]?.createdAt || validDate(raw.createdAt);
  const updatedAt = messages.at(-1)?.createdAt || validDate(raw.updatedAt, createdAt);
  const conversation = messages.length
    ? {
        id: "conv-build01-reprise",
        title: "Conversation reprise",
        createdAt,
        updatedAt,
        status: "active",
        mode: "free",
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        messages,
      }
    : null;

  return {
    ...base,
    settings: { ...base.settings, ...(raw.settings && typeof raw.settings === "object" ? raw.settings : {}) },
    lastSession: raw.lastSession && typeof raw.lastSession === "object" ? raw.lastSession : null,
    conversations: conversation ? [conversation] : [],
    activeConversationId: conversation?.id || null,
  };
}

const normalizeMessage = (message) => {
  if (!message || typeof message !== "object") return null;
  const status = [MESSAGE_STATUS.generating, MESSAGE_STATUS.partial].includes(message.status)
    ? MESSAGE_STATUS.interrupted
    : message.status;
  return { ...message, content: String(message.content ?? ""), status };
};

export function migrateState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  if (raw.version === 1) return migrateBuild01(raw);
  if (raw.version === 2) {
    return migrateState({
      ...raw,
      version: STORAGE_VERSION,
      sessionRecords: [],
      memoryEntries: [],
    });
  }
  if (raw.version !== STORAGE_VERSION) throw new Error(`Version de stockage inconnue: ${raw.version}`);
  const base = defaultState();
  const conversations = Array.isArray(raw.conversations)
    ? raw.conversations.filter(Boolean).map((conversation) => ({
        ...conversation,
        schemaVersion: conversation.schemaVersion || CONVERSATION_SCHEMA_VERSION,
        messages: Array.isArray(conversation.messages) ? conversation.messages.map(normalizeMessage).filter(Boolean) : [],
      }))
    : [];
  const activeConversationId = conversations.some((c) => c.id === raw.activeConversationId)
    ? raw.activeConversationId
    : conversations[0]?.id || null;
  return {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings || {}) },
    conversations,
    activeConversationId,
    sessionRecords: Array.isArray(raw.sessionRecords) ? raw.sessionRecords.filter(Boolean) : [],
    memoryEntries: Array.isArray(raw.memoryEntries) ? raw.memoryEntries.filter(Boolean) : [],
  };
}

export function createStore(storage = globalThis.localStorage) {
  let writesBlocked = false;

  const load = () => {
    try {
      const serialized = storage.getItem(STORAGE_KEY);
      const raw = JSON.parse(serialized);
      if (raw?.version === 1 && serialized) storage.setItem(BUILD01_BACKUP_KEY, serialized);
      const loaded = migrateState(raw);
      writesBlocked = false;
      return loaded;
    } catch (error) {
      if (String(error.message).includes("Version")) {
        writesBlocked = true;
        return { ...defaultState(), storageError: error.message, writesBlocked: true };
      }
      return defaultState();
    }
  };

  const save = (state) => {
    if (writesBlocked || state.storageError || state.writesBlocked) return false;
    if (!state.settings.saveLocally) {
      storage.removeItem(STORAGE_KEY);
      return true;
    }
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: STORAGE_VERSION, storageError: undefined, writesBlocked: undefined }));
    return true;
  };

  const clear = () => {
    writesBlocked = false;
    storage.removeItem(STORAGE_KEY);
  };

  return { load, save, clear };
}
