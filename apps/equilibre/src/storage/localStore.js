import { CONVERSATION_SCHEMA_VERSION, MESSAGE_STATUS } from "../domain/conversation.js";

export const STORAGE_KEY = "equilibre.local.v1";
export const STORAGE_VERSION = 4;
export const BUILD01_BACKUP_KEY = `${STORAGE_KEY}.build01.backup`;
export const V2_BACKUP_KEY = `${STORAGE_KEY}.v2.backup`;
export const V3_BACKUP_KEY = `${STORAGE_KEY}.v3.backup`;
export const V4_ROLLBACK_BACKUP_KEY = `${STORAGE_KEY}.v4.rollback.backup`;
export const V4_RESTORE_BACKUP_KEY = `${STORAGE_KEY}.v4.restore.backup`;
export const V5_ACTIVATION_MARKER_KEY = `${STORAGE_KEY}.v5.active`;
export const BACKUP_KEYS = Object.freeze([
  BUILD01_BACKUP_KEY,
  V2_BACKUP_KEY,
  V3_BACKUP_KEY,
  V4_ROLLBACK_BACKUP_KEY,
  V4_RESTORE_BACKUP_KEY,
]);

const MIGRATION_EPOCH = "2026-01-01T00:00:00.000Z";

export function defaultState() {
  return {
    version: STORAGE_VERSION,
    storageRevision: 0,
    settings: { saveLocally: true, theme: "system" },
    conversations: [],
    activeConversationId: null,
    messages: [],
    lastSession: null,
    protocolRuns: [],
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

export const normalizeMemoryEntry = (entry) => {
  if (!entry?.source) return entry;
  if (entry.source.sessionRecordId !== undefined) return entry;
  return {
    ...entry,
    source: {
      type: entry.source.type || "session",
      sessionRecordId: entry.source.id ?? null,
      sourceSessionId: null,
    },
  };
};

const normalizeMessage = (message) => {
  if (!message || typeof message !== "object") return null;
  const status = [MESSAGE_STATUS.generating, MESSAGE_STATUS.partial].includes(message.status)
    ? MESSAGE_STATUS.interrupted
    : message.status;
  return { ...message, content: String(message.content ?? ""), status };
};

const validRevision = (value) => Number.isSafeInteger(value) && value >= 0;

function normalizeV4(raw) {
  const base = defaultState();
  const conversations = Array.isArray(raw.conversations)
    ? raw.conversations.filter(Boolean).map((conversation) => ({
        ...conversation,
        schemaVersion: conversation.schemaVersion || CONVERSATION_SCHEMA_VERSION,
        messages: Array.isArray(conversation.messages)
          ? conversation.messages.map(normalizeMessage).filter(Boolean)
          : [],
      }))
    : [];
  const activeConversationId = conversations.some((c) => c.id === raw.activeConversationId)
    ? raw.activeConversationId
    : conversations[0]?.id || null;
  return {
    ...base,
    ...raw,
    version: STORAGE_VERSION,
    storageRevision: validRevision(raw.storageRevision) ? raw.storageRevision : 0,
    settings: { ...base.settings, ...(raw.settings || {}) },
    conversations,
    activeConversationId,
    protocolRuns: Array.isArray(raw.protocolRuns) ? raw.protocolRuns.filter(Boolean) : [],
    sessionRecords: Array.isArray(raw.sessionRecords) ? raw.sessionRecords.filter(Boolean) : [],
    memoryEntries: Array.isArray(raw.memoryEntries)
      ? raw.memoryEntries.filter(Boolean).map(normalizeMemoryEntry)
      : [],
  };
}

export function migrateState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  if (raw.version === 1) return normalizeV4(migrateBuild01(raw));
  if (raw.version === 2) {
    return normalizeV4({
      ...raw,
      version: STORAGE_VERSION,
      storageRevision: 0,
      sessionRecords: [],
      memoryEntries: [],
      protocolRuns: [],
    });
  }
  if (raw.version === 3) {
    return normalizeV4({
      ...raw,
      version: STORAGE_VERSION,
      storageRevision: 0,
      protocolRuns: [],
    });
  }
  if (raw.version !== STORAGE_VERSION) {
    throw new Error(`Version de stockage inconnue: ${raw.version}`);
  }
  return normalizeV4(raw);
}

function parseStoredState(serialized) {
  if (serialized === null) return { kind: "missing", raw: null, value: null };
  if (serialized === "") return { kind: "corrupt", raw: serialized, value: null };
  try {
    const value = JSON.parse(serialized);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { kind: "corrupt", raw: serialized, value: null };
    }
    return { kind: "state", raw: serialized, value };
  } catch {
    return { kind: "corrupt", raw: serialized, value: null };
  }
}

function isBlankReactivationState(state) {
  return state
    && Array.isArray(state.conversations) && state.conversations.length === 0
    && Array.isArray(state.protocolRuns) && state.protocolRuns.length === 0
    && Array.isArray(state.sessionRecords) && state.sessionRecords.length === 0
    && Array.isArray(state.memoryEntries) && state.memoryEntries.length === 0
    && (state.lastSession === null || state.lastSession === undefined)
    && (state.activeConversationId === null || state.activeConversationId === undefined)
    && (!Array.isArray(state.messages) || state.messages.length === 0);
}

function storageErrorState(message) {
  return { ...defaultState(), storageError: message, writesBlocked: true };
}

export function createStore(storage = globalThis.localStorage) {
  let writesBlocked = false;
  let observedRevision = 0;
  let externallyInvalidated = false;
  let allowBlankReactivationAfterClear = false;

  const v5FenceActive = () => storage.getItem(V5_ACTIVATION_MARKER_KEY) !== null;
  const fenceV4Writer = (loadedState) => {
    writesBlocked = true;
    externallyInvalidated = true;
    allowBlankReactivationAfterClear = false;
    return {
      ...loadedState,
      storageError: "Une version de stockage plus récente est active. Cette version d’Équilibre reste en lecture seule.",
      writesBlocked: true,
      futureStorageActive: true,
    };
  };

  const observeRevisionFromSerialized = (serialized) => {
    const parsed = parseStoredState(serialized);
    if (parsed.kind !== "state" || parsed.value.version !== STORAGE_VERSION) return null;
    const revision = parsed.value.storageRevision;
    if (!validRevision(revision)) return null;
    observedRevision = Math.max(observedRevision, revision);
    return revision;
  };

  const persistLegacyAsV4 = (raw, serialized, backupKey) => {
    if (storage.getItem(backupKey) === null) storage.setItem(backupKey, serialized);
    const migrated = migrateState(raw);
    const nextRevision = Math.max(1, observedRevision + 1);
    const persisted = {
      ...migrated,
      version: STORAGE_VERSION,
      storageRevision: nextRevision,
      protocolRuns: Array.isArray(migrated.protocolRuns) ? migrated.protocolRuns : [],
    };
    const nextSerialized = JSON.stringify(persisted);
    storage.setItem(STORAGE_KEY, nextSerialized);
    observedRevision = nextRevision;
    writesBlocked = false;
    externallyInvalidated = false;
    allowBlankReactivationAfterClear = false;
    return persisted;
  };

  const load = () => {
    const serialized = storage.getItem(STORAGE_KEY);
    if (serialized === null) {
      if (v5FenceActive()) return fenceV4Writer(defaultState());
      writesBlocked = false;
      externallyInvalidated = false;
      allowBlankReactivationAfterClear = false;
      observedRevision = 0;
      return defaultState();
    }

    const parsed = parseStoredState(serialized);
    if (parsed.kind !== "state") {
      writesBlocked = true;
      externallyInvalidated = false;
      allowBlankReactivationAfterClear = false;
      return storageErrorState("Stockage local corrompu : écriture bloquée jusqu’à effacement explicite.");
    }

    const raw = parsed.value;
    try {
      if (v5FenceActive()) {
        const readable = [1, 2, 3, STORAGE_VERSION].includes(raw.version) ? migrateState(raw) : defaultState();
        if (raw.version === STORAGE_VERSION && validRevision(raw.storageRevision)) observedRevision = raw.storageRevision;
        return fenceV4Writer(readable);
      }
      if (raw.version === 1) return persistLegacyAsV4(raw, serialized, BUILD01_BACKUP_KEY);
      if (raw.version === 2) return persistLegacyAsV4(raw, serialized, V2_BACKUP_KEY);
      if (raw.version === 3) return persistLegacyAsV4(raw, serialized, V3_BACKUP_KEY);

      const loaded = migrateState(raw);
      observedRevision = loaded.storageRevision;
      writesBlocked = false;
      externallyInvalidated = false;
      allowBlankReactivationAfterClear = false;
      return loaded;
    } catch (error) {
      writesBlocked = true;
      externallyInvalidated = false;
      allowBlankReactivationAfterClear = false;
      return storageErrorState(String(error?.message || error));
    }
  };

  const save = (state) => {
    if (v5FenceActive()) {
      writesBlocked = true;
      externallyInvalidated = true;
      return false;
    }
    if (writesBlocked || externallyInvalidated || state?.storageError || state?.writesBlocked) return false;
    if (!state?.settings?.saveLocally) {
      clear();
      return true;
    }

    const currentSerialized = storage.getItem(STORAGE_KEY);
    const current = parseStoredState(currentSerialized);

    if (current.kind === "corrupt") {
      writesBlocked = true;
      return false;
    }

    if (current.kind === "missing") {
      if (observedRevision > 0) {
        if (!allowBlankReactivationAfterClear || !isBlankReactivationState(state)) return false;
      }
    } else {
      if (current.value.version !== STORAGE_VERSION || !validRevision(current.value.storageRevision)) {
        writesBlocked = true;
        return false;
      }
      const currentRevision = current.value.storageRevision;
      if (currentRevision !== observedRevision) return false;
    }

    const nextRevision = observedRevision + 1;
    try {
      const serialized = JSON.stringify({
        ...state,
        version: STORAGE_VERSION,
        storageRevision: nextRevision,
        protocolRuns: Array.isArray(state.protocolRuns) ? state.protocolRuns : [],
        storageError: undefined,
        writesBlocked: undefined,
      });
      storage.setItem(STORAGE_KEY, serialized);
    } catch {
      return false;
    }

    observedRevision = nextRevision;
    allowBlankReactivationAfterClear = false;
    externallyInvalidated = false;
    return true;
  };

  const clear = () => {
    if (v5FenceActive()) {
      writesBlocked = true;
      externallyInvalidated = true;
      return false;
    }
    const currentSerialized = storage.getItem(STORAGE_KEY);
    observeRevisionFromSerialized(currentSerialized);

    storage.removeItem(STORAGE_KEY);
    for (const key of BACKUP_KEYS) storage.removeItem(key);

    writesBlocked = false;
    externallyInvalidated = false;
    allowBlankReactivationAfterClear = true;
    return true;
  };

  const restore = (candidateState) => {
    if (v5FenceActive()) {
      writesBlocked = true;
      externallyInvalidated = true;
      return false;
    }

    let restored;
    try {
      restored = migrateState(candidateState);
    } catch {
      return false;
    }
    if (restored.version !== STORAGE_VERSION) return false;

    const currentSerialized = storage.getItem(STORAGE_KEY);
    const current = parseStoredState(currentSerialized);
    if (current.kind === "corrupt") return false;
    if (current.kind === "missing" && observedRevision > 0) return false;
    if (current.kind === "state") {
      if (current.value.version !== STORAGE_VERSION || !validRevision(current.value.storageRevision)) return false;
      if (current.value.storageRevision !== observedRevision) return false;
    }
    const nextRevision = Math.max(observedRevision, validRevision(restored.storageRevision) ? restored.storageRevision : 0) + 1;
    const nextState = {
      ...restored,
      version: STORAGE_VERSION,
      storageRevision: nextRevision,
      settings: { ...restored.settings, saveLocally: true },
      storageError: undefined,
      writesBlocked: undefined,
      futureStorageActive: undefined,
    };

    try {
      if (currentSerialized !== null) storage.setItem(V4_RESTORE_BACKUP_KEY, currentSerialized);
      storage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      return false;
    }

    observedRevision = nextRevision;
    writesBlocked = false;
    externallyInvalidated = false;
    allowBlankReactivationAfterClear = false;
    return true;
  };

  const handleStorageEvent = (event = {}) => {
    if (event.key !== STORAGE_KEY) return false;
    if (event.oldValue !== undefined && event.oldValue !== null) {
      observeRevisionFromSerialized(event.oldValue);
    }
    if (event.newValue === null) {
      allowBlankReactivationAfterClear = false;
      externallyInvalidated = true;
      return true;
    }
    const revision = observeRevisionFromSerialized(event.newValue);
    if (revision !== null) {
      allowBlankReactivationAfterClear = false;
      externallyInvalidated = true;
      return true;
    }
    writesBlocked = true;
    externallyInvalidated = true;
    return true;
  };

  const rollbackToV3 = () => {
    const rawV3 = storage.getItem(V3_BACKUP_KEY);
    const parsedV3 = parseStoredState(rawV3);
    if (parsedV3.kind !== "state" || parsedV3.value.version !== 3) return false;

    const currentV4 = storage.getItem(STORAGE_KEY);
    const parsedV4 = parseStoredState(currentV4);
    if (parsedV4.kind !== "state" || parsedV4.value.version !== STORAGE_VERSION) return false;

    try {
      if (storage.getItem(V4_ROLLBACK_BACKUP_KEY) === null) {
        storage.setItem(V4_ROLLBACK_BACKUP_KEY, currentV4);
      }
      storage.setItem(STORAGE_KEY, rawV3);
      writesBlocked = true;
      externallyInvalidated = true;
      allowBlankReactivationAfterClear = false;
      return true;
    } catch {
      return false;
    }
  };

  return { load, save, clear, restore, handleStorageEvent, rollbackToV3 };
}
