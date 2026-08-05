import { CONVERSATION_SCHEMA_VERSION, createConversation, createMessage } from "../domain/conversation.js";
export const STORAGE_KEY = "equilibre.local.v1";
export const STORAGE_VERSION = 2;
export function defaultState() { return { version: STORAGE_VERSION, settings: { saveLocally: true, theme: "system" }, conversations: [], activeConversationId: null, messages: [], lastSession: null }; }
export function migrateBuild01(raw) {
  const base = defaultState();
  const legacyMessages = Array.isArray(raw.messages) ? raw.messages : [];
  const conv = legacyMessages.length ? createConversation({ title: "Conversation reprise", mode: "free", now: new Date("2026-01-01T00:00:00.000Z") }) : null;
  return { ...base, settings: { ...base.settings, ...(raw.settings || {}) }, lastSession: raw.lastSession || null, conversations: conv ? [{ ...conv, messages: legacyMessages.map((m, i) => createMessage({ id: m.id || `legacy-${i}`, role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || ""), status: m.role === "assistant" ? "complete" : "sent", provenance: m.provider || "build-01", now: m.createdAt ? new Date(m.createdAt) : new Date("2026-01-01T00:00:00.000Z") })) }] : [], activeConversationId: conv?.id || null };
}
export function migrateState(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  if (raw.version === 1) return migrateBuild01(raw);
  if (raw.version !== STORAGE_VERSION) throw new Error(`Version de stockage inconnue: ${raw.version}`);
  const base = defaultState();
  const conversations = Array.isArray(raw.conversations) ? raw.conversations.filter(Boolean).map((c) => ({ ...c, schemaVersion: c.schemaVersion || CONVERSATION_SCHEMA_VERSION, messages: Array.isArray(c.messages) ? c.messages : [] })) : [];
  const activeConversationId = conversations.some((c) => c.id === raw.activeConversationId) ? raw.activeConversationId : conversations[0]?.id || null;
  return { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) }, conversations, activeConversationId };
}
export function createStore(storage = globalThis.localStorage) {
  let clearedSinceLastSave = false;
  const load = () => { try { return migrateState(JSON.parse(storage.getItem(STORAGE_KEY))); } catch (e) { if (String(e.message).includes("Version")) return { ...defaultState(), storageError: e.message }; return defaultState(); } };
  const save = (state) => { if (!state.settings.saveLocally) { clearedSinceLastSave = true; return storage.removeItem(STORAGE_KEY); } const safeState = clearedSinceLastSave ? defaultState() : state; clearedSinceLastSave = false; storage.setItem(STORAGE_KEY, JSON.stringify({ ...safeState, version: STORAGE_VERSION })); };
  const clear = () => { clearedSinceLastSave = true; storage.removeItem(STORAGE_KEY); };
  return { load, save, clear };
}
