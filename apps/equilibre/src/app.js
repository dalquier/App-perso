import "./styles.css";
import { answerSession, createSession } from "./domain/session.js";
import {
  changeConversationMode,
  CONVERSATION_MODES,
  createConversation,
  createMessage,
  addMessage,
  MESSAGE_STATUS,
  renameConversation,
  titleFromMessage,
  updateMessage,
} from "./domain/conversation.js";
import { createLocalConversationProvider } from "./providers/conversationProvider.js";
import { localStorageContextNotice } from "./platform/displayMode.js";
import { scrollChatToBottom } from "./platform/viewport.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "./safety/sensitiveGuard.js";
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

const activeConversation = () => state.conversations.find((c) => c.id === state.activeConversationId) || null;
const persist = () => store.save(state);

const refresh = () => {
  render({ followChat: view === "chat" });
  requestAnimationFrame(() => {
    document.querySelector("main")?.focus();
  });
};
const setView = (nextView) => { view = nextView; refresh(); };

function saveConversation(conversation, options = {}) {
  state = updateConversationById({ ...state, conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)] }, conversation.id, () => conversation, options);
  persist();
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

const shell = (content) => `<div class="app-shell"><header class="topbar"><button class="brand" data-view="home" aria-label="Retour à l’accueil"><span class="brand-mark">É</span><span>Équilibre</span></button><button class="icon-button" data-view="settings" aria-label="Réglages">•••</button></header><main tabindex="-1">${content}</main><nav class="tabbar" aria-label="Navigation principale"><button class="tab ${view === "home" ? "active" : ""}" data-view="home">⌂ Accueil</button><button class="tab ${view === "conversations" ? "active" : ""}" data-view="conversations">☰ Historique</button><button class="tab ${view === "chat" ? "active" : ""}" data-view="chat">◌ Échanger</button><button class="tab ${view === "session" ? "active" : ""}" data-view="session">◇ Séance</button></nav></div>`;

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
  if (session.completed) return `<section class="complete"><span class="complete-mark">✓</span><h1>Un pas à la fois.</h1><dl>${Object.entries(session.answers).map(([key, value]) => `<div><dt>${stepCopy[key][0]}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><button class="button primary-button" data-view="home">Accueil</button></section>`;
  const steps = ["situation", "emotion", "thought", "action"];
  const index = steps.indexOf(session.step);
  const copy = stepCopy[session.step];
  return `<section class="session-head"><button class="back" data-view="home">×</button><span>Étape ${index + 1} sur 4</span></section><div class="progress"><i style="width:${((index + 1) / 4) * 100}%"></i></div><section class="session-card"><p class="eyebrow">${copy[0]}</p><h1>${copy[1]}</h1><form id="session-form"><textarea rows="5" maxlength="1000" placeholder="${copy[2]}" required>${escapeHtml(session.answers[session.step] || "")}</textarea><div class="session-actions">${index > 0 ? `<button class="button" type="button" data-prev-step>← Retour</button>` : ""}<button class="button primary-button" type="submit">Continuer →</button></div></form></section>`;
}

function settingsView() {
  return `<section class="page-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">Vos choix</p><h1>Confidentialité</h1></div></section><section class="settings-list"><label class="setting"><span><strong>Enregistrer sur cet appareil</strong><small>Désactiver efface les données sauvegardées et en mémoire.</small></span><input id="save-setting" type="checkbox" ${state.settings.saveLocally ? "checked" : ""}></label><label class="setting"><span><strong>Apparence</strong><small>Clair, sombre ou système.</small></span><select id="theme-setting"><option value="system">Système</option><option value="light">Clair</option><option value="dark">Sombre</option></select></label></section><section class="danger-zone"><h2>Vos données</h2><p>Supprime conversations, messages, séance et réglages locaux.</p><button id="clear-data" class="danger-button">Effacer toutes mes données</button></section>`;
}

function render({ followChat = false } = {}) {
  const content = view === "chat" ? chatView() : view === "conversations" ? conversationsView() : view === "session" ? sessionView() : view === "settings" ? settingsView() : homeView();
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
      persist();
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

app.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);

  if (event.target.closest("[data-new-conversation]")) {
    saveConversation(createConversation(), { makeActive: true });
    setView("chat");
  }

  const open = event.target.closest("[data-open-conversation]");
  if (open) {
    state.activeConversationId = open.dataset.openConversation;
    persist();
    setView("chat");
  }

  const rename = event.target.closest("[data-rename-conversation]");
  if (rename) {
    const conversation = state.conversations.find((c) => c.id === rename.dataset.renameConversation);
    const title = prompt("Nouveau titre", conversation?.title || "");
    if (conversation && title) saveConversation(renameConversation(conversation, title));
    setView("conversations");
  }

  const deletion = event.target.closest("[data-delete-conversation]");
  if (deletion && confirm("Supprimer définitivement cette conversation ?")) {
    generations.get(deletion.dataset.deleteConversation)?.abort();
    generations.delete(deletion.dataset.deleteConversation);
    state = { ...state, conversations: state.conversations.filter((c) => c.id !== deletion.dataset.deleteConversation) };
    state.activeConversationId = state.conversations[0]?.id || null;
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
    if (index > 0) state.lastSession = { ...state.lastSession, step: steps[index - 1] };
    persist();
    render();
  }

  if (event.target.closest("[data-start-session]")) {
    state.lastSession = createSession();
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
      state = { ...state, settings: { ...state.settings, saveLocally: true } };
      persist();
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
    const content = event.target.elements[0].value.trim();
    if (!content) return;
    let conversation = ensureConversation();
    conversation = addMessage(conversation, createMessage({ role: "user", content, provenance: "user" }));
    if (conversation.title === "Nouvelle conversation") conversation = renameConversation(conversation, titleFromMessage(content));
    const blocked = detectSensitiveContent(content);
    const assistant = blocked
      ? createMessage({ role: "assistant", content: SAFETY_MESSAGE, status: MESSAGE_STATUS.complete, provenance: "safety-guard" })
      : createMessage({ role: "assistant", content: "", status: MESSAGE_STATUS.generating, provenance: provider.id });
    conversation = addMessage(conversation, assistant);
    saveConversation(conversation, { makeActive: true });
    render();
    if (!blocked) generateReply(conversation.id, assistant.id);
  }

  if (event.target.id === "session-form") {
    const value = event.target.elements[0].value;
    if (detectSensitiveContent(value)) {
      alert(SAFETY_MESSAGE);
      return;
    }
    state.lastSession = answerSession(state.lastSession, value);
    persist();
    render();
  }
});

render();
if ("serviceWorker" in navigator) window.addEventListener("load", async () => {
  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  await registration.update();
});
