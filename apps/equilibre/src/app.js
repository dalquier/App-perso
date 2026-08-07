import "./styles.css";
import { answerSession, createSession } from "./domain/session.js";
import {
  applyMemoryCorrection,
  confirmMemory,
  createSessionRecord,
  proposeMemory,
  removeMemory,
  MEMORY_STATUS,
} from "./domain/memory.js";
import {
  changeConversationMode,
  CONVERSATION_MODES,
  createConversation,
  createMessage,
  addMessage,
  MESSAGE_STATUS,
  interruptConversationGeneration,
  renameConversation,
  updateConversationById,
  titleFromMessage,
  updateMessage,
} from "./domain/conversation.js";
import { createLocalConversationProvider } from "./providers/conversationProvider.js";
import { localStorageContextNotice } from "./platform/displayMode.js";
import { scrollChatToBottom } from "./platform/viewport.js";
import { answerProtocolStep, completeProtocolRun } from "./protocols/engine.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "./safety/sensitiveGuard.js";
import { gateProtocolText } from "./safety/textGate.js";
import { createStore, defaultState } from "./storage/localStore.js";

const provider = createLocalConversationProvider();
const store = createStore();
const app = document.querySelector("#app");
const storageContextNotice = localStorageContextNotice();
let state = normalizeRuntimeState(store.load());
let view = "home";
const generations = new Map();

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[char]);

export function normalizeRuntimeState(nextState) {
  return {
    ...defaultState(),
    ...nextState,
    conversations: (nextState.conversations || []).map((conversation) => ({
      ...conversation,
      messages: (conversation.messages || []).map((message) =>
        [MESSAGE_STATUS.generating, MESSAGE_STATUS.partial].includes(message.status)
          ? { ...message, status: MESSAGE_STATUS.interrupted, errorRef: message.errorRef || "restart_interruption" }
          : message,
      ),
    })),
  };
}

export function persistPreparedState(storeRef, nextState) {
  if (storeRef.save(nextState)) return { ok: true, state: nextState };
  return { ok: false, state: normalizeRuntimeState(storeRef.load()) };
}

export function prepareChatSubmission(currentState, rawContent, { providerId = "local-simulator" } = {}) {
  const gate = gateProtocolText(rawContent, { required: true, maxLength: 1500 });
  if (!gate.ok) return { ...gate, state: currentState };

  const existing = currentState.conversations.find((conversation) => conversation.id === currentState.activeConversationId) || null;
  let conversation = existing || createConversation();
  conversation = addMessage(conversation, createMessage({ role: "user", content: gate.value, provenance: "user" }));
  if (conversation.title === "Nouvelle conversation") conversation = renameConversation(conversation, titleFromMessage(gate.value));
  const assistant = createMessage({ role: "assistant", content: "", status: MESSAGE_STATUS.generating, provenance: providerId });
  conversation = addMessage(conversation, assistant);
  const nextState = {
    ...currentState,
    conversations: [conversation, ...currentState.conversations.filter((item) => item.id !== conversation.id)],
    activeConversationId: conversation.id,
  };
  return { ok: true, blocked: false, state: nextState, conversation, assistant };
}

export function prepareConversationRename(conversation, rawTitle) {
  const gate = gateProtocolText(rawTitle, { required: true, maxLength: 120 });
  if (!gate.ok) return { ...gate, conversation };
  return { ok: true, blocked: false, conversation: renameConversation(conversation, gate.value) };
}

export function prepareLegacySessionAnswer(currentState, rawValue) {
  if (!currentState.lastSession) throw new Error("Aucune séance legacy active.");
  const gate = gateProtocolText(rawValue, { required: true, maxLength: 1000 });
  if (!gate.ok) return { ...gate, state: currentState };
  const lastSession = answerSession(currentState.lastSession, gate.value);
  let sessionRecords = currentState.sessionRecords;
  if (lastSession.completed && !sessionRecords.some((item) => item.sourceSessionId === lastSession.id)) {
    sessionRecords = [...sessionRecords, createSessionRecord(lastSession)];
  }
  return { ok: true, blocked: false, state: { ...currentState, lastSession, sessionRecords } };
}

export function prepareProtocolAnswer(currentState, options) {
  const result = answerProtocolStep(currentState, options);
  if (!result.ok) return { ...result, state: currentState };
  return result;
}

export function prepareProtocolCompletion(currentState, options) {
  const result = completeProtocolRun(currentState, options);
  if (result.blocked) return { ...result, state: currentState };
  return result;
}

export function prepareMemoryProposal(currentState, sessionRecordId, { kind = "action" } = {}) {
  const record = currentState.sessionRecords.find((item) => item.id === sessionRecordId);
  if (!record) throw new Error("Enregistrement de séance introuvable.");
  if (currentState.memoryEntries.some((entry) => entry.source?.sessionRecordId === record.id)) {
    return { ok: true, idempotent: true, state: currentState };
  }
  const content = String(record.actionPlan || "").trim();
  if (!content) throw new Error("Une action non vide est requise pour proposer cette mémoire.");
  const entry = proposeMemory({
    content,
    sessionRecordId: record.id,
    sourceSessionId: record.sourceSessionId,
    kind,
  });
  return { ok: true, idempotent: false, entry, state: { ...currentState, memoryEntries: [...currentState.memoryEntries, entry] } };
}

export function prepareMemoryConfirmation(currentState, memoryId) {
  const entry = currentState.memoryEntries.find((item) => item.id === memoryId);
  if (!entry) return { ok: false, state: currentState };
  const confirmed = confirmMemory(entry);
  return {
    ok: true,
    state: { ...currentState, memoryEntries: currentState.memoryEntries.map((item) => item.id === memoryId ? confirmed : item) },
  };
}

export function prepareMemoryCorrection(currentState, memoryId, rawContent) {
  const entry = currentState.memoryEntries.find((item) => item.id === memoryId);
  if (!entry) return { ok: false, state: currentState };
  const result = applyMemoryCorrection(entry, rawContent);
  if (result.blocked || result.rejected) return { ...result, ok: false, state: currentState };
  return {
    ok: true,
    blocked: false,
    state: { ...currentState, memoryEntries: currentState.memoryEntries.map((item) => item.id === memoryId ? result.entry : item) },
  };
}

const activeConversation = () => state.conversations.find((c) => c.id === state.activeConversationId) || null;
const persist = () => {
  const result = persistPreparedState(store, state);
  state = result.ok ? result.state : { ...result.state, storageError: result.state.storageError || "La sauvegarde locale a été refusée. L’état courant a été rechargé." };
  return result.ok;
};

const refresh = () => {
  render({ followChat: view === "chat" });
  requestAnimationFrame(() => {
    document.querySelector("main")?.focus();
  });
};
const setView = (nextView) => { view = nextView; refresh(); };

function saveConversation(conversation, options = {}) {
  state = updateConversationById({ ...state, conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)] }, conversation.id, () => conversation, options);
  return persist();
}

function ensureConversation(mode = "free") {
  const existing = activeConversation();
  if (existing) return existing;
  const conversation = createConversation({ mode });
  saveConversation(conversation, { makeActive: true });
  return conversation;
}

const stepCopy = {
  situation: ["La situation", "Que s’est-il passé, simplement et factuellement ?", "Ex. : Une tâche prévue a été reportée."],
  emotion: ["L’émotion", "Quelle émotion est la plus présente ?", "Ex. : Inquiétude, 6 sur 10."],
  thought: ["La pensée", "Quelle pensée vous traverse dans cette situation ?", "Ex. : Je ne vais pas y arriver."],
  action: ["La prochaine action", "Quel tout petit pas réaliste pouvez-vous choisir ?", "Ex. : Ouvrir le document pendant deux minutes."],
};

const shell = (content) => `<div class="app-shell"><header class="topbar"><button class="brand" data-view="home" aria-label="Retour à l’accueil"><span class="brand-mark">É</span><span>Équilibre</span></button><button class="icon-button" data-view="settings" aria-label="Réglages">•••</button></header><main tabindex="-1">${content}</main><nav class="tabbar" aria-label="Navigation principale"><button class="tab ${view === "home" ? "active" : ""}" data-view="home">⌂ Accueil</button><button class="tab ${view === "conversations" ? "active" : ""}" data-view="conversations">☰ Historique</button><button class="tab ${view === "chat" ? "active" : ""}" data-view="chat">◌ Échanger</button><button class="tab ${view === "session" ? "active" : ""}" data-view="session">◇ Séance</button><button class="tab ${view === "memory" ? "active" : ""}" data-view="memory">✦ Mémoire</button></nav></div>`;

function homeView() {
  const conversation = activeConversation();
  const contextNotice = storageContextNotice
    ? `<aside class="storage-context-note" role="status"><strong>${escapeHtml(storageContextNotice.title)}</strong><p>${escapeHtml(storageContextNotice.body)}</p></aside>`
    : "";
  return `<section class="hero"><p class="eyebrow">Votre espace local</p><h1>Une conversation écrite<br><em>que vous pouvez reprendre.</em></h1><p class="lead">Plusieurs échanges persistants, sans compte et sans service distant obligatoire.</p></section>${state.storageError ? `<p class="error-banner">${escapeHtml(state.storageError)}</p>` : ""}${contextNotice}<section class="choices"><button class="choice-card primary" data-new-conversation><span>✦</span><span><strong>Nouvelle conversation</strong><small>Démarrer rapidement</small></span><span>→</span></button>${conversation ? `<button class="choice-card" data-open-conversation="${conversation.id}"><span>↻</span><span><strong>Reprendre</strong><small>${escapeHtml(conversation.title)}</small></span><span>→</span></button>` : ""}<button class="choice-card" data-view="conversations"><span>☰</span><span><strong>Historique</strong><small>${state.conversations.length} conversation(s)</small></span><span>→</span></button><button class="choice-card" data-start-session><span>◇</span><span><strong>Séance guidée BUILD-01</strong><small>4 étapes · conservée</small></span><span>→</span></button></section><aside class="local-note"><span>⌾</span><p><strong>Mode local dégradé disponible</strong><br>Les réponses progressives viennent du simulateur embarqué.</p></aside><p class="disclaimer">Équilibre ne pose aucun diagnostic et ne remplace pas un professionnel.</p>`;
}

function conversationsView() {
  const rows = state.conversations.map((c) => `<article class="conversation-row ${c.id === state.activeConversationId ? "active" : ""}"><button data-open-conversation="${c.id}"><strong>${escapeHtml(c.title)}</strong><small>${CONVERSATION_MODES[c.mode]?.label} · ${c.messages.length} message(s)</small><small>Modifiée ${new Date(c.updatedAt).toLocaleString("fr-FR")}</small></button><button class="mini" data-rename-conversation="${c.id}" aria-label="Renommer ${escapeHtml(c.title)}">Renommer</button><button class="mini danger" data-delete-conversation="${c.id}" aria-label="Supprimer ${escapeHtml(c.title)}">Supprimer</button></article>`).join("");
  return `<section class="page-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">Reprise</p><h1>Conversations</h1></div><button class="small-primary" data-new-conversation aria-label="Nouvelle conversation">＋</button></section><div class="conversation-list">${rows || `<div class="empty-state"><span>✦</span><h2>Aucune conversation</h2><p>Créez un premier échange. Il restera disponible dans cet espace local.</p></div>`}</div>`;
}

function chatView() {
  const conversation = ensureConversation();
  const generating = conversation.messages.some((m) => [MESSAGE_STATUS.generating, MESSAGE_STATUS.partial].includes(m.status));
  const messages = conversation.messages.map((m) => `<div class="message ${m.role} ${m.status}"><small>${m.role === "user" ? "Vous" : m.provenance === "safety-guard" ? "Garde-fou" : `Équilibre · ${m.status}`}</small><p>${escapeHtml(m.content)}</p>${m.errorRef ? `<small>Référence : ${escapeHtml(m.errorRef)}</small>` : ""}</div>`).join("");
  return `<div class="chat-toolbar"><section class="page-heading chat-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">${provider.degraded ? "Mode local" : "Fournisseur"}</p><h1>${escapeHtml(conversation.title)}</h1></div></section><label class="mode-picker">Mode<select id="mode-select">${Object.entries(CONVERSATION_MODES).map(([key, m]) => `<option value="${key}" ${conversation.mode === key ? "selected" : ""}>${m.label}</option>`).join("")}</select></label></div><div class="chat-log" aria-live="polite">${messages || `<div class="empty-state"><span>✦</span><h2>Écrivez quelques mots</h2><p>Le fil, son mode et les messages resteront ordonnés après réouverture.</p></div>`}</div><form class="composer" id="chat-form"><textarea id="chat-input" maxlength="1500" rows="2" placeholder="Écrivez ici…" ${generating ? "disabled" : "required"}></textarea>${generating ? `<button type="button" data-stop-generation="${conversation.id}">Stop</button>` : `<button type="submit">↑</button>`}</form>`;
}

function sessionView() {
  if (!state.lastSession) state.lastSession = createSession();
  const session = state.lastSession;
  if (session.completed) {
    const record = state.sessionRecords.find((item) => item.sourceSessionId === session.id);
    const alreadyProposed = state.memoryEntries.some((entry) => entry.source?.sessionRecordId === record?.id);
    return `<section class="session-complete"><span class="complete-mark">✓</span><h1>Un pas à la fois.</h1><dl>${Object.entries(session.answers).map(([key, value]) => `<div><dt>${stepCopy[key][0]}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${record ? `<section class="local-note"><p><strong>Résumé local</strong><br>${escapeHtml(record.summary)}</p></section><section class="local-note"><p><strong>Plan d’action</strong><br>${escapeHtml(record.actionPlan)}</p></section>${alreadyProposed ? `<button class="button" data-view="memory">Voir ma mémoire</button>` : `<button class="button primary-button" data-propose-session-memory="${record.id}">Proposer ce plan dans ma mémoire</button>`}` : ""}<button class="button" data-view="home">Accueil</button></section>`;
  }
  const steps = ["situation", "emotion", "thought", "action"];
  const index = steps.indexOf(session.step);
  const copy = stepCopy[session.step];
  return `<section class="session-head"><button class="back" data-view="home">×</button><span>Étape ${index + 1} sur 4</span></section><div class="progress"><i style="width:${((index + 1) / 4) * 100}%"></i></div><section class="session-card"><p class="eyebrow">${copy[0]}</p><h1>${copy[1]}</h1><form id="session-form"><textarea rows="5" maxlength="1000" placeholder="${copy[2]}" required>${escapeHtml(session.answers[session.step] || "")}</textarea><div class="session-actions">${index > 0 ? `<button class="button" type="button" data-prev-step>← Retour</button>` : ""}<button class="button primary-button" type="submit">Continuer →</button></div></form></section>`;
}

function memoryView() {
  const entries = state.memoryEntries.map((entry) => `<article class="conversation-row"><div><strong>${entry.status === MEMORY_STATUS.confirmed ? "Mémoire confirmée" : "Proposition à valider"}</strong><p>${escapeHtml(entry.content)}</p><small>Source : séance ${escapeHtml(entry.source?.sessionRecordId || "inconnue")}</small></div>${entry.status === MEMORY_STATUS.proposed ? `<button class="mini" data-confirm-memory="${entry.id}">Confirmer</button>` : ""}<button class="mini" data-edit-memory="${entry.id}">Corriger</button><button class="mini danger" data-delete-memory="${entry.id}">Supprimer</button></article>`).join("");
  return `<section class="page-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">Sous votre contrôle</p><h1>Ma mémoire</h1></div></section><p class="lead">Rien n’est ajouté automatiquement. Vous confirmez, corrigez ou supprimez chaque élément.</p><div class="conversation-list">${entries || `<div class="empty-state"><span>✦</span><h2>Mémoire vide</h2><p>Terminez une séance puis choisissez explicitement ce que vous souhaitez conserver.</p></div>`}</div>`;
}

function settingsView() {
  return `<section class="page-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">Vos choix</p><h1>Confidentialité</h1></div></section><section class="settings-list"><label class="setting"><span><strong>Enregistrer sur cet appareil</strong><small>Désactiver efface les données sauvegardées et en mémoire.</small></span><input id="save-setting" type="checkbox" ${state.settings.saveLocally ? "checked" : ""}></label><label class="setting"><span><strong>Apparence</strong><small>Clair, sombre ou système.</small></span><select id="theme-setting"><option value="system">Système</option><option value="light">Clair</option><option value="dark">Sombre</option></select></label></section><section class="danger-zone"><h2>Vos données</h2><p>Supprime conversations, messages, séance et réglages locaux.</p><button id="clear-data" class="danger-button">Effacer toutes mes données</button></section>`;
}

function render({ followChat = false } = {}) {
  const content = view === "chat" ? chatView() : view === "conversations" ? conversationsView() : view === "session" ? sessionView() : view === "memory" ? memoryView() : view === "settings" ? settingsView() : homeView();
  app.innerHTML = shell(content);
  document.documentElement.dataset.theme = state.settings.theme;
  const theme = document.querySelector("#theme-setting");
  if (theme) theme.value = state.settings.theme;
  if (followChat) scrollChatToBottom();
}

async function generateReply(conversationId, assistantId) {
  const controller = new AbortController();
  generations.set(conversationId, controller);
  const snapshot = state.conversations.find((c) => c.id === conversationId);
  try {
    for await (const chunk of provider.generate({ conversation: snapshot, signal: controller.signal })) {
      if (!generations.has(conversationId)) return;
      state = updateConversationById(state, conversationId, (conversation) => updateMessage(conversation, assistantId, {
        content: chunk.content,
        status: chunk.done ? MESSAGE_STATUS.complete : MESSAGE_STATUS.partial,
        provenance: provider.id,
      }));
      if (!persist()) {
        controller.abort();
        generations.delete(conversationId);
        render({ followChat: activeConversation()?.id === conversationId && view === "chat" });
        return;
      }
      if (activeConversation()?.id === conversationId) render({ followChat: true });
    }
  } catch (error) {
    if (!generations.has(conversationId)) return;
    state = updateConversationById(state, conversationId, (conversation) => {
      const message = provider.errorMessage(error);
      return updateMessage(conversation, assistantId, {
        content: message.content || "Erreur fournisseur structurée.",
        status: MESSAGE_STATUS.error,
        provenance: message.provenance || provider.id,
        errorRef: message.errorRef || error.code || "provider_error",
      });
    });
    persist();
  } finally {
    generations.delete(conversationId);
    render({ followChat: activeConversation()?.id === conversationId && view === "chat" });
  }
}

function interruptOutgoingGeneration(nextConversationId = null) {
  const outgoingConversationId = state.activeConversationId;
  if (!outgoingConversationId || outgoingConversationId === nextConversationId || !generations.has(outgoingConversationId)) return;
  generations.get(outgoingConversationId)?.abort();
  generations.delete(outgoingConversationId);
  state = interruptConversationGeneration(state, outgoingConversationId, "conversation_switched");
  persist();
}

app.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);

  if (event.target.closest("[data-new-conversation]")) {
    interruptOutgoingGeneration();
    saveConversation(createConversation(), { makeActive: true });
    setView("chat");
  }

  const open = event.target.closest("[data-open-conversation]");
  if (open) {
    interruptOutgoingGeneration(open.dataset.openConversation);
    const nextState = { ...state, activeConversationId: open.dataset.openConversation };
    state = nextState;
    persist();
    setView("chat");
  }

  const rename = event.target.closest("[data-rename-conversation]");
  if (rename) {
    const conversation = state.conversations.find((c) => c.id === rename.dataset.renameConversation);
    const title = prompt("Nouveau titre", conversation?.title || "");
    if (conversation && title) {
      const result = prepareConversationRename(conversation, title);
      if (result.blocked) alert(SAFETY_MESSAGE);
      else if (result.ok) saveConversation(result.conversation);
    }
    setView("conversations");
  }

  const deletion = event.target.closest("[data-delete-conversation]");
  if (deletion && confirm("Supprimer définitivement cette conversation ?")) {
    generations.get(deletion.dataset.deleteConversation)?.abort();
    generations.delete(deletion.dataset.deleteConversation);
    const conversations = state.conversations.filter((c) => c.id !== deletion.dataset.deleteConversation);
    state = { ...state, conversations, activeConversationId: conversations[0]?.id || null };
    persist();
    render();
  }

  const stop = event.target.closest("[data-stop-generation]");
  if (stop) {
    generations.get(stop.dataset.stopGeneration)?.abort();
    state = interruptConversationGeneration(state, stop.dataset.stopGeneration);
    persist();
    render();
  }

  if (event.target.closest("[data-prev-step]")) {
    const steps = ["situation", "emotion", "thought", "action"];
    const index = steps.indexOf(state.lastSession?.step);
    if (index > 0) state = { ...state, lastSession: { ...state.lastSession, step: steps[index - 1] } };
    persist();
    render();
  }

  const proposal = event.target.closest("[data-propose-session-memory]");
  if (proposal) {
    try {
      const result = prepareMemoryProposal(state, proposal.dataset.proposeSessionMemory);
      if (result.ok && !result.idempotent) {
        state = result.state;
        persist();
      }
      setView("memory");
    } catch (error) {
      if (error?.blocked) alert(SAFETY_MESSAGE);
    }
  }

  const confirmation = event.target.closest("[data-confirm-memory]");
  if (confirmation) {
    try {
      const result = prepareMemoryConfirmation(state, confirmation.dataset.confirmMemory);
      if (result.ok) {
        state = result.state;
        persist();
      }
      render();
    } catch (error) {
      if (error?.blocked) alert(SAFETY_MESSAGE);
    }
  }

  const edition = event.target.closest("[data-edit-memory]");
  if (edition) {
    const entry = state.memoryEntries.find((item) => item.id === edition.dataset.editMemory);
    const content = prompt("Corriger cet élément", entry?.content || "");
    if (entry && content?.trim()) {
      const result = prepareMemoryCorrection(state, entry.id, content);
      if (result.blocked) {
        alert(SAFETY_MESSAGE);
      } else if (result.ok) {
        state = result.state;
        persist();
        render();
      }
    }
  }

  const memoryDeletion = event.target.closest("[data-delete-memory]");
  if (memoryDeletion && confirm("Supprimer définitivement cet élément de mémoire ?")) {
    state = { ...state, memoryEntries: removeMemory(state.memoryEntries, memoryDeletion.dataset.deleteMemory) };
    persist();
    render();
  }

  if (event.target.closest("[data-start-session]")) {
    state = { ...state, lastSession: createSession() };
    persist();
    setView("session");
  }

  if (event.target.closest("#clear-data") && confirm("Effacer définitivement toutes les données locales d’Équilibre ?")) {
    generations.forEach((controller) => controller.abort());
    generations.clear();
    store.clear();
    state = defaultState();
    setView("home");
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id === "mode-select") {
    const conversation = activeConversation();
    if (conversation) saveConversation(changeConversationMode(conversation, event.target.value));
    render();
  }

  if (event.target.id === "save-setting") {
    if (!event.target.checked) {
      generations.forEach((controller) => controller.abort());
      generations.clear();
      store.clear();
      state = { ...defaultState(), settings: { ...defaultState().settings, saveLocally: false, theme: state.settings.theme } };
    } else {
      const nextState = { ...state, settings: { ...state.settings, saveLocally: true } };
      const result = persistPreparedState(store, nextState);
      state = result.ok ? result.state : { ...result.state, storageError: result.state.storageError || "La réactivation de la sauvegarde a été refusée." };
    }
    render();
  }

  if (event.target.id === "theme-setting") {
    state = { ...state, settings: { ...state.settings, theme: event.target.value } };
    persist();
    render();
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "chat-form") {
    const result = prepareChatSubmission(state, event.target.elements[0].value, { providerId: provider.id });
    if (!result.ok) {
      if (result.blocked) alert(SAFETY_MESSAGE);
      return;
    }
    state = result.state;
    if (!persist()) {
      render();
      return;
    }
    render();
    generateReply(result.conversation.id, result.assistant.id);
  }

  if (event.target.id === "session-form") {
    const result = prepareLegacySessionAnswer(state, event.target.elements[0].value);
    if (!result.ok) {
      if (result.blocked) alert(SAFETY_MESSAGE);
      return;
    }
    state = result.state;
    persist();
    render();
  }
});

render();
if ("serviceWorker" in navigator) window.addEventListener("load", async () => {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    await registration.update();
  } catch (_) {
    // Service worker non disponible — l'application reste fonctionnelle
  }
});
