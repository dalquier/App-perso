export const CONVERSATION_SCHEMA_VERSION = 2;
export const CONVERSATION_MODES = {
  free: { label: "Échange libre", prompt: "Accueillir et clarifier doucement ce qui est présent." },
  clarify: { label: "Clarifier une situation", prompt: "Aider à distinguer les faits, ressentis et besoins sans diagnostic." },
  action: { label: "Préparer une prochaine action", prompt: "Aider à choisir un pas concret, réaliste et doux." },
};
export const MESSAGE_STATUS = { sent: "sent", generating: "generating", partial: "partial", complete: "complete", interrupted: "interrupted", error: "error" };
let sequence = 0;
export const makeId = (prefix, now = new Date()) => `${prefix}-${now.getTime()}-${++sequence}`;
export function createConversation({ title = "Nouvelle conversation", mode = "free", now = new Date() } = {}) {
  const id = makeId("conv", now);
  return { id, title, createdAt: now.toISOString(), updatedAt: now.toISOString(), status: "active", mode: CONVERSATION_MODES[mode] ? mode : "free", schemaVersion: CONVERSATION_SCHEMA_VERSION, messages: [] };
}
export function createMessage({ role, content, status, provenance, errorRef = null, now = new Date(), id } = {}) {
  return { id: id || makeId(role || "msg", now), role, content: content || "", createdAt: now.toISOString(), status: status || (role === "user" ? MESSAGE_STATUS.sent : MESSAGE_STATUS.complete), provenance: provenance || "local", errorRef };
}
export function addMessage(conversation, message, now = new Date()) {
  return { ...conversation, updatedAt: now.toISOString(), status: "active", messages: [...conversation.messages, message] };
}
export function updateMessage(conversation, messageId, patch, now = new Date()) {
  return { ...conversation, updatedAt: now.toISOString(), messages: conversation.messages.map((m) => m.id === messageId ? { ...m, ...patch } : m) };
}
export function renameConversation(conversation, title, now = new Date()) {
  const clean = title.trim();
  if (!clean) return conversation;
  return { ...conversation, title: clean.slice(0, 80), updatedAt: now.toISOString() };
}
export function changeConversationMode(conversation, mode, now = new Date()) {
  if (!CONVERSATION_MODES[mode]) return conversation;
  return { ...conversation, mode, updatedAt: now.toISOString() };
}
export function titleFromMessage(content) {
  const clean = content.trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, 42) : "Nouvelle conversation";
}

export function updateConversationById(currentState, conversationId, updater, { makeActive = false } = {}) {
  let found = false;
  const conversations = currentState.conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;
    found = true;
    return updater(conversation);
  });
  if (!found) return currentState;
  return {
    ...currentState,
    conversations: conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    activeConversationId: makeActive ? conversationId : currentState.activeConversationId,
  };
}

export function interruptConversationGeneration(currentState, conversationId, reason = "user_interruption") {
  return updateConversationById(currentState, conversationId, (conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) =>
      [MESSAGE_STATUS.generating, MESSAGE_STATUS.partial].includes(message.status)
        ? { ...message, status: MESSAGE_STATUS.interrupted, errorRef: reason }
        : message,
    ),
  }));
}
