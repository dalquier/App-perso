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
import { protocolRegistry } from "./protocols/catalog.js";
import {
  abandonProtocolRun,
  answerProtocolStep,
  completeProtocolRun,
  createProtocolRun,
  moveProtocolBack,
  previewProtocolRun,
} from "./protocols/engine.js";
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
const protocolUi = {
  screen: "catalog",
  protocolId: null,
  protocolVersion: null,
  runId: null,
  safetyMessage: null,
  errorMessage: null,
};

const PRIMARY_NAV = Object.freeze([
  { id: "home", icon: "⌂", label: "Accueil" },
  { id: "conversations", icon: "☰", label: "Historique" },
  { id: "chat", icon: "◌", label: "Échanger" },
  { id: "protocols", icon: "◇", label: "Protocoles" },
  { id: "memory", icon: "✦", label: "Mémoire" },
]);

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

const activeConversation = () => state.conversations.find((c) => c.id === state.activeConversationId) || null;
const activeProtocolRun = () => state.protocolRuns.find((run) => run.id === protocolUi.runId) || null;
const draftProtocolRun = () => state.protocolRuns.find((run) => run.status === "draft") || null;
const persist = () => store.save(state);

const refresh = () => {
  render({ followChat: view === "chat" });
  requestAnimationFrame(() => document.querySelector("main")?.focus());
};
const setView = (nextView) => {
  view = nextView;
  if (nextView === "protocols" && protocolUi.screen === "result" && !activeProtocolRun()) protocolUi.screen = "catalog";
  refresh();
};

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

const shell = (content) => `<div class="app-shell"><header class="topbar"><button class="brand" data-view="home" aria-label="Retour à l’accueil"><span class="brand-mark">É</span><span>Équilibre</span></button><button class="icon-button" data-view="settings" aria-label="Réglages">•••</button></header><main tabindex="-1">${content}</main><nav class="tabbar" aria-label="Navigation principale">${PRIMARY_NAV.map((item) => `<button class="tab ${view === item.id ? "active" : ""}" data-view="${item.id}" aria-label="${item.label}"><span aria-hidden="true">${item.icon}</span>${item.label}</button>`).join("")}</nav></div>`;

function homeView() {
  const conversation = activeConversation();
  const contextNotice = storageContextNotice
    ? `<aside class="storage-context-note" role="status"><strong>${escapeHtml(storageContextNotice.title)}</strong><p>${escapeHtml(storageContextNotice.body)}</p></aside>`
    : "";
  return `<section class="hero"><p class="eyebrow">Votre espace local</p><h1>Une conversation écrite<br><em>que vous pouvez reprendre.</em></h1><p class="lead">Plusieurs échanges persistants, sans compte et sans service distant obligatoire.</p></section>${state.storageError ? `<p class="error-banner">${escapeHtml(state.storageError)}</p>` : ""}${contextNotice}<section class="choices"><button class="choice-card primary" data-new-conversation><span>✦</span><span><strong>Nouvelle conversation</strong><small>Démarrer rapidement</small></span><span>→</span></button>${conversation ? `<button class="choice-card" data-open-conversation="${conversation.id}"><span>↻</span><span><strong>Reprendre</strong><small>${escapeHtml(conversation.title)}</small></span><span>→</span></button>` : ""}<button class="choice-card" data-view="conversations"><span>☰</span><span><strong>Historique</strong><small>${state.conversations.length} conversation(s)</small></span><span>→</span></button><button class="choice-card" data-view="protocols"><span>◇</span><span><strong>Protocoles</strong><small>2 activités guidées · locales</small></span><span>→</span></button></section><aside class="local-note"><span>⌾</span><p><strong>Mode local dégradé disponible</strong><br>Les réponses progressives viennent du simulateur embarqué.</p></aside><p class="disclaimer">Équilibre ne pose aucun diagnostic et ne remplace pas un professionnel.</p>`;
}

function conversationsView() {
  const rows = state.conversations.map((c) => `<article class="conversation-row ${c.id === state.activeConversationId ? "active" : ""}"><button data-open-conversation="${c.id}"><strong>${escapeHtml(c.title)}</strong><small>${CONVERSATION_MODES[c.mode]?.label} · ${c.messages.length} message(s)</small><small>Modifiée ${new Date(c.updatedAt).toLocaleString("fr-FR")}</small></button><button class="mini" data-rename-conversation="${c.id}" aria-label="Renommer ${escapeHtml(c.title)}">Renommer</button><button class="mini danger" data-delete-conversation="${c.id}" aria-label="Supprimer ${escapeHtml(c.title)}">Supprimer</button></article>`).join("");
  return `<section class="page-heading"><button class="back" data-view="home" aria-label="Retour">←</button><div><p class="eyebrow">Reprise</p><h1>Conversations</h1></div><button class="small-primary" data-new-conversation aria-label="Nouvelle conversation">＋</button></section><div class="conversation-list">${rows || `<div class="empty-state"><span>✦</span><h2>Aucune conversation</h2><p>Créez un premier échange. Il restera disponible dans cet espace local.</p></div>`}</div>`;
}

function chatView() {
  const conversation = ensureConversation();
  const generating = conversation.messages.some((m) => [MESSAGE_STATUS.generating, MESSAGE_STATUS.partial].includes(m.status));
  const messages = conversation.messages.map((m) => `<div class="message ${m.role} ${m.status}"><small>${m.role === "user" ? "Vous" : m.provenance === "safety-guard" ? "Garde-fou" : `Équilibre · ${m.status}`}</small><p>${escapeHtml(m.content)}</p>${m.errorRef ? `<small>Référence : ${escapeHtml(m.errorRef)}</small>` : ""}</div>`).join("");
  return `<div class="chat-toolbar"><section class="page-heading chat-heading"><button class="back" data-view="home" aria-label="Retour">←</button><div><p class="eyebrow">${provider.degraded ? "Mode local" : "Fournisseur"}</p><h1>${escapeHtml(conversation.title)}</h1></div></section><label class="mode-picker">Mode<select id="mode-select">${Object.entries(CONVERSATION_MODES).map(([key, m]) => `<option value="${key}" ${conversation.mode === key ? "selected" : ""}>${m.label}</option>`).join("")}</select></label></div><div class="chat-log" aria-live="polite">${messages || `<div class="empty-state"><span>✦</span><h2>Écrivez quelques mots</h2><p>Le fil, son mode et les messages resteront ordonnés après réouverture.</p></div>`}</div><form class="composer" id="chat-form"><label class="sr-only" for="chat-input">Votre message</label><textarea id="chat-input" maxlength="1500" rows="2" placeholder="Écrivez ici…" ${generating ? "disabled" : "required"}></textarea>${generating ? `<button type="button" data-stop-generation="${conversation.id}">Stop</button>` : `<button type="submit" aria-label="Envoyer">↑</button>`}</form>`;
}

function sessionView() {
  if (!state.lastSession) state.lastSession = createSession();
  const session = state.lastSession;
  if (session.completed) {
    const record = state.sessionRecords.find((item) => item.sourceSessionId === session.id);
    const alreadyProposed = state.memoryEntries.some((entry) => entry.source?.sessionRecordId === record?.id);
    return `<section class="session-complete"><span class="complete-mark">✓</span><h1>Un pas à la fois.</h1><dl>${Object.entries(session.answers).map(([key, value]) => `<div><dt>${stepCopy[key][0]}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${record ? `<section class="local-note"><p><strong>Résumé local</strong><br>${escapeHtml(record.summary)}</p></section><section class="local-note"><p><strong>Plan d’action</strong><br>${escapeHtml(record.actionPlan)}</p></section>${alreadyProposed ? `<button class="button" data-view="memory">Voir ma mémoire</button>` : `<button class="button primary-button" data-propose-session-memory="${record.id}">Proposer ce plan dans ma mémoire</button>`}` : ""}<button class="button" data-view="protocols">Retour aux protocoles</button></section>`;
  }
  const steps = ["situation", "emotion", "thought", "action"];
  const index = steps.indexOf(session.step);
  const copy = stepCopy[session.step];
  return `<section class="session-head"><button class="back" data-view="protocols" aria-label="Quitter la séance BUILD-01">×</button><span>Étape ${index + 1} sur 4</span></section><div class="progress"><i style="width:${((index + 1) / 4) * 100}%"></i></div><section class="session-card"><p class="eyebrow">Séance BUILD-01 · ${copy[0]}</p><h1>${copy[1]}</h1><form id="session-form"><label class="sr-only" for="legacy-session-answer">Réponse</label><textarea id="legacy-session-answer" rows="5" maxlength="1000" placeholder="${copy[2]}" required>${escapeHtml(session.answers[session.step] || "")}</textarea><div class="session-actions">${index > 0 ? `<button class="button" type="button" data-prev-step>← Retour</button>` : ""}<button class="button primary-button" type="submit">Continuer →</button></div></form></section>`;
}

const definitionForUi = () => protocolUi.protocolId
  ? protocolRegistry.get(protocolUi.protocolId, protocolUi.protocolVersion)
  : null;

function protocolCatalogView() {
  const definitions = protocolRegistry.listActive();
  const draft = draftProtocolRun();
  const legacy = state.lastSession && state.lastSession.completed === false ? state.lastSession : null;
  const resume = draft ? `<button class="protocol-resume" data-resume-protocol="${draft.id}"><span class="protocol-symbol">↻</span><span><strong>Reprendre le protocole en cours</strong><small>${escapeHtml(protocolRegistry.get(draft.protocolId, draft.protocolVersion)?.title || "Activité guidée")} · reprise uniquement sur action</small></span><span aria-hidden="true">→</span></button>` : "";
  const legacyCard = legacy ? `<article class="legacy-session-card"><div><p class="eyebrow">Compatibilité BUILD-01</p><h2>Séance guidée inachevée</h2><p>Cette séance reste séparée des protocoles BUILD-04. Reprenez-la ou terminez-la avant de démarrer un nouveau protocole.</p></div><button class="button" data-resume-legacy-session>Reprendre la séance BUILD-01</button></article>` : "";
  return `<section class="page-heading protocol-heading"><button class="back" data-view="home" aria-label="Retour">←</button><div><p class="eyebrow">Activités guidées</p><h1>Protocoles</h1></div></section>${resume}${legacyCard}<section class="protocol-grid" aria-label="Catalogue des protocoles">${definitions.map((definition, index) => `<article class="protocol-card" data-protocol-card><div class="protocol-card-top"><span class="protocol-index">0${index + 1}</span><span class="protocol-duration">${escapeHtml(definition.estimatedDuration)}</span></div><h2>${escapeHtml(definition.title)}</h2><p>${escapeHtml(definition.objective)}</p><button class="button primary-button" data-open-protocol="${definition.id}" data-protocol-version="${definition.version}">Découvrir</button></article>`).join("")}</section><p class="disclaimer">Deux protocoles actifs. La séance BUILD-01 éventuelle reste une compatibilité distincte, jamais un troisième protocole.</p>`;
}

function protocolPresentationView(definition) {
  if (!definition) return protocolCatalogView();
  return `<section class="protocol-topline"><button class="back" data-protocol-catalog aria-label="Retour au catalogue">←</button><span>${escapeHtml(definition.estimatedDuration)}</span></section><section class="protocol-presentation"><p class="eyebrow">Protocole guidé</p><h1>${escapeHtml(definition.title)}</h1><p class="protocol-objective">${escapeHtml(definition.objective)}</p><aside class="protocol-warning" role="note"><strong>À savoir avant de commencer</strong><p>${escapeHtml(definition.warning)}</p></aside><div class="protocol-usage"><section><h2>À utiliser quand</h2><ul>${definition.useWhen.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section><h2>À ne pas utiliser quand</h2><ul>${definition.doNotUseWhen.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section></div><details class="protocol-limits"><summary>Limites de ce protocole</summary><ul>${definition.limits.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></details>${state.lastSession?.completed === false ? `<p class="inline-error" role="status">Une séance BUILD-01 inachevée doit d’abord être reprise ou terminée.</p>` : ""}<button class="button primary-button protocol-start" data-start-protocol ${state.lastSession?.completed === false || draftProtocolRun() ? "disabled" : ""}>Commencer</button><button class="text-button" data-protocol-catalog>Retour aux protocoles</button></section>`;
}

function protocolRunView(definition, run) {
  if (!definition || !run) {
    protocolUi.screen = "catalog";
    return protocolCatalogView();
  }
  const stepIndex = definition.steps.findIndex((step) => step.id === run.currentStepId);
  const step = definition.steps[stepIndex];
  const value = run.answers?.[step.id]?.value || "";
  const progress = Math.round(((stepIndex + 1) / definition.steps.length) * 100);
  return `<section class="protocol-topline"><button class="text-button protocol-quit" data-quit-protocol>Quitter</button><span>Question ${stepIndex + 1} sur ${definition.steps.length}</span></section><div class="progress protocol-progress" aria-label="Progression ${progress} %"><i style="width:${progress}%"></i></div><section class="protocol-question-card"><p class="eyebrow">${escapeHtml(step.label)} · ${step.required ? "Obligatoire" : "Facultatif"}</p><h1>${escapeHtml(step.question)}</h1><details class="protocol-help"><summary>Aide</summary><p>${escapeHtml(step.optionalHelp || "Prenez quelques mots, sans chercher la réponse parfaite.")}</p>${step.example ? `<p class="protocol-example"><strong>Exemple fictif :</strong> ${escapeHtml(step.example)}</p>` : ""}</details>${protocolUi.errorMessage ? `<p class="inline-error" role="alert">${escapeHtml(protocolUi.errorMessage)}</p>` : ""}<form id="protocol-form"><label class="sr-only" for="protocol-answer">${escapeHtml(step.question)}</label><textarea id="protocol-answer" name="answer" rows="6" maxlength="${step.maxLength}" ${step.required ? "required" : ""} aria-describedby="protocol-counter">${escapeHtml(value)}</textarea><div class="protocol-field-meta"><span>${step.required ? "Réponse requise" : "Vous pouvez laisser vide"}</span><span id="protocol-counter" data-protocol-counter aria-live="polite">${[...value].length} / ${step.maxLength}</span></div><div class="protocol-actions">${stepIndex > 0 ? `<button class="button" type="button" data-protocol-back>← Retour</button>` : `<span></span>`}<button class="button primary-button" type="submit">Continuer →</button></div></form></section>`;
}

function previewMarkup(preview) {
  return `<dl class="protocol-summary">${preview.summary.split("\n").filter(Boolean).map((line) => { const separator = line.indexOf(" : "); const label = separator >= 0 ? line.slice(0, separator) : "Résumé"; const value = separator >= 0 ? line.slice(separator + 3) : line; return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`; }).join("")}</dl>`;
}

function protocolPreviewView(definition, run) {
  if (!definition || !run) return protocolCatalogView();
  let preview;
  try {
    preview = previewProtocolRun(state, { runId: run.id });
  } catch (error) {
    protocolUi.errorMessage = String(error?.message || error);
    protocolUi.screen = "run";
    return protocolRunView(definition, run);
  }
  return `<section class="protocol-topline"><button class="back" data-preview-edit aria-label="Modifier une réponse">←</button><span>Aperçu avant validation</span></section><section class="protocol-preview"><p class="eyebrow">Vérifiez avant de terminer</p><h1>${escapeHtml(definition.resultScreen.title)}</h1><p class="lead">${escapeHtml(definition.resultScreen.introduction)}</p>${previewMarkup(preview)}<section class="protocol-action-preview"><span>Action</span><strong>${preview.actionText ? escapeHtml(preview.actionText) : "Aucune action définie"}</strong></section><p class="protocol-result-note">${escapeHtml(definition.resultScreen.note)}</p><button class="button primary-button" data-complete-protocol>Terminer</button><button class="text-button" data-preview-edit>Modifier une réponse</button></section>`;
}

function protocolResultView(definition, run) {
  const result = run?.result;
  if (!definition || !result) return protocolCatalogView();
  return `<section class="session-complete protocol-result" aria-live="polite"><span class="complete-mark">✓</span><p class="eyebrow">Protocole terminé</p><h1>${escapeHtml(definition.resultScreen.title)}</h1><p class="lead">${escapeHtml(definition.resultScreen.introduction)}</p>${previewMarkup(result)}<section class="protocol-action-preview"><span>Action</span><strong>${result.actionText ? escapeHtml(result.actionText) : "Aucune action définie"}</strong></section><p class="protocol-result-note">${escapeHtml(definition.resultScreen.note)}</p><button class="button primary-button" data-protocol-catalog>Retour aux protocoles</button></section>`;
}

function protocolSafetyView() {
  return `<section class="protocol-safety" role="alert"><span class="safety-mark" aria-hidden="true">!</span><p class="eyebrow">Parcours interrompu</p><h1>La sécurité passe avant l’exercice.</h1><p>${escapeHtml(protocolUi.safetyMessage || SAFETY_MESSAGE)}</p><p class="protocol-result-note">Votre réponse sensible n’a pas été enregistrée par le protocole. Vous pouvez quitter ce parcours et utiliser l’aide adaptée à la situation.</p><button class="button" data-protocol-catalog>Retour aux protocoles</button></section>`;
}

function protocolsView() {
  if (protocolUi.screen === "safety") return protocolSafetyView();
  const definition = definitionForUi();
  const run = activeProtocolRun();
  if (protocolUi.screen === "presentation") return protocolPresentationView(definition);
  if (protocolUi.screen === "run") return protocolRunView(definition, run);
  if (protocolUi.screen === "preview") return protocolPreviewView(definition, run);
  if (protocolUi.screen === "result") return protocolResultView(definition, run);
  return protocolCatalogView();
}

function memoryView() {
  const entries = state.memoryEntries.map((entry) => `<article class="conversation-row"><div><strong>${entry.status === MEMORY_STATUS.confirmed ? "Mémoire confirmée" : "Proposition à valider"}</strong><p>${escapeHtml(entry.content)}</p><small>Source : séance ${escapeHtml(entry.source?.sessionRecordId || "inconnue")}</small></div>${entry.status === MEMORY_STATUS.proposed ? `<button class="mini" data-confirm-memory="${entry.id}">Confirmer</button>` : ""}<button class="mini" data-edit-memory="${entry.id}">Corriger</button><button class="mini danger" data-delete-memory="${entry.id}">Supprimer</button></article>`).join("");
  return `<section class="page-heading"><button class="back" data-view="home" aria-label="Retour">←</button><div><p class="eyebrow">Sous votre contrôle</p><h1>Ma mémoire</h1></div></section><p class="lead">Rien n’est ajouté automatiquement. Vous confirmez, corrigez ou supprimez chaque élément.</p><div class="conversation-list">${entries || `<div class="empty-state"><span>✦</span><h2>Mémoire vide</h2><p>Terminez une séance puis choisissez explicitement ce que vous souhaitez conserver.</p></div>`}</div>`;
}

function settingsView() {
  return `<section class="page-heading"><button class="back" data-view="home" aria-label="Retour">←</button><div><p class="eyebrow">Vos choix</p><h1>Confidentialité</h1></div></section><section class="settings-list"><label class="setting"><span><strong>Enregistrer sur cet appareil</strong><small>Désactiver efface les données sauvegardées et en mémoire.</small></span><input id="save-setting" type="checkbox" ${state.settings.saveLocally ? "checked" : ""}></label><label class="setting"><span><strong>Apparence</strong><small>Clair, sombre ou système.</small></span><select id="theme-setting"><option value="system">Système</option><option value="light">Clair</option><option value="dark">Sombre</option></select></label></section><section class="danger-zone"><h2>Vos données</h2><p>Supprime conversations, messages, séances, protocoles et réglages locaux.</p><button id="clear-data" class="danger-button">Effacer toutes mes données</button></section>`;
}

function render({ followChat = false } = {}) {
  const content = view === "chat" ? chatView()
    : view === "conversations" ? conversationsView()
      : view === "session" ? sessionView()
        : view === "protocols" ? protocolsView()
          : view === "memory" ? memoryView()
            : view === "settings" ? settingsView()
              : homeView();
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

function interruptOutgoingGeneration(nextConversationId = null) {
  const outgoingConversationId = state.activeConversationId;
  if (!outgoingConversationId || outgoingConversationId === nextConversationId || !generations.has(outgoingConversationId)) return;
  generations.get(outgoingConversationId)?.abort();
  generations.delete(outgoingConversationId);
  state = interruptConversationGeneration(state, outgoingConversationId, "conversation_switched");
  persist();
}

function resetProtocolUi(screen = "catalog") {
  protocolUi.screen = screen;
  protocolUi.protocolId = null;
  protocolUi.protocolVersion = null;
  protocolUi.runId = null;
  protocolUi.safetyMessage = null;
  protocolUi.errorMessage = null;
}

function showProtocolSafety(message) {
  protocolUi.safetyMessage = message || SAFETY_MESSAGE;
  protocolUi.errorMessage = null;
  protocolUi.screen = "safety";
  render();
}

app.addEventListener("click", async (event) => {
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

  const proposal = event.target.closest("[data-propose-session-memory]");
  if (proposal) {
    const record = state.sessionRecords.find((item) => item.id === proposal.dataset.proposeSessionMemory);
    if (record && !state.memoryEntries.some((entry) => entry.source?.sessionRecordId === record.id)) {
      state.memoryEntries = [...state.memoryEntries, proposeMemory({ content: record.actionPlan, sessionRecordId: record.id, sourceSessionId: record.sourceSessionId, kind: "action" })];
      persist();
    }
    setView("memory");
  }

  const confirmation = event.target.closest("[data-confirm-memory]");
  if (confirmation) {
    state.memoryEntries = state.memoryEntries.map((entry) => entry.id === confirmation.dataset.confirmMemory ? confirmMemory(entry) : entry);
    persist();
    render();
  }

  const edition = event.target.closest("[data-edit-memory]");
  if (edition) {
    const entry = state.memoryEntries.find((item) => item.id === edition.dataset.editMemory);
    const content = prompt("Corriger cet élément", entry?.content || "");
    if (entry && content?.trim()) {
      const result = applyMemoryCorrection(entry, content);
      if (result.blocked) alert(SAFETY_MESSAGE);
      else {
        state.memoryEntries = state.memoryEntries.map((item) => item.id === entry.id ? result.entry : item);
        persist();
        render();
      }
    }
  }

  const memoryDeletion = event.target.closest("[data-delete-memory]");
  if (memoryDeletion && confirm("Supprimer définitivement cet élément de mémoire ?")) {
    state.memoryEntries = removeMemory(state.memoryEntries, memoryDeletion.dataset.deleteMemory);
    persist();
    render();
  }

  if (event.target.closest("[data-start-session]")) {
    state.lastSession = createSession();
    persist();
    setView("session");
  }

  if (event.target.closest("[data-resume-legacy-session]")) setView("session");

  const openProtocol = event.target.closest("[data-open-protocol]");
  if (openProtocol) {
    protocolUi.protocolId = openProtocol.dataset.openProtocol;
    protocolUi.protocolVersion = openProtocol.dataset.protocolVersion;
    protocolUi.runId = null;
    protocolUi.errorMessage = null;
    protocolUi.safetyMessage = null;
    protocolUi.screen = "presentation";
    render();
  }

  const resumeProtocol = event.target.closest("[data-resume-protocol]");
  if (resumeProtocol) {
    const run = state.protocolRuns.find((item) => item.id === resumeProtocol.dataset.resumeProtocol && item.status === "draft");
    if (run) {
      protocolUi.protocolId = run.protocolId;
      protocolUi.protocolVersion = run.protocolVersion;
      protocolUi.runId = run.id;
      protocolUi.errorMessage = null;
      protocolUi.safetyMessage = null;
      protocolUi.screen = "run";
      render();
    }
  }

  if (event.target.closest("[data-protocol-catalog]")) {
    resetProtocolUi("catalog");
    view = "protocols";
    render();
  }

  if (event.target.closest("[data-start-protocol]")) {
    try {
      state = await createProtocolRun(state, {
        protocolId: protocolUi.protocolId,
        protocolVersion: protocolUi.protocolVersion,
      });
      const run = draftProtocolRun();
      protocolUi.runId = run?.id || null;
      protocolUi.screen = "run";
      protocolUi.errorMessage = null;
      persist();
      render();
    } catch (error) {
      protocolUi.errorMessage = String(error?.message || error);
      render();
    }
  }

  if (event.target.closest("[data-protocol-back]")) {
    const run = activeProtocolRun();
    if (run) {
      state = moveProtocolBack(state, { runId: run.id });
      protocolUi.errorMessage = null;
      persist();
      render();
    }
  }

  if (event.target.closest("[data-quit-protocol]")) {
    const run = activeProtocolRun();
    if (run && confirm("Abandonner ce protocole ? Le brouillon sera supprimé.")) {
      state = abandonProtocolRun(state, { runId: run.id });
      persist();
      resetProtocolUi("catalog");
      render();
    }
  }

  if (event.target.closest("[data-preview-edit]")) {
    const run = activeProtocolRun();
    if (run) {
      state = moveProtocolBack(state, { runId: run.id });
      persist();
      protocolUi.screen = "run";
      protocolUi.errorMessage = null;
      render();
    }
  }

  if (event.target.closest("[data-complete-protocol]")) {
    const run = activeProtocolRun();
    if (run) {
      try {
        const control = completeProtocolRun(state, { runId: run.id });
        if (control.blocked) {
          showProtocolSafety(control.safetyMessage);
          return;
        }
        state = control.state;
        persist();
        protocolUi.screen = "result";
        render();
      } catch (error) {
        protocolUi.errorMessage = String(error?.message || error);
        protocolUi.screen = "preview";
        render();
      }
    }
  }

  if (event.target.closest("#clear-data") && confirm("Effacer définitivement toutes les données locales d’Équilibre ?")) {
    generations.forEach((controller) => controller.abort());
    generations.clear();
    store.clear();
    state = defaultState();
    resetProtocolUi();
    setView("home");
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "protocol-answer") {
    const counter = document.querySelector("[data-protocol-counter]");
    if (counter) counter.textContent = `${[...event.target.value].length} / ${event.target.maxLength}`;
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
      resetProtocolUi();
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
    if (state.lastSession.completed && !state.sessionRecords.some((item) => item.sourceSessionId === state.lastSession.id)) {
      state.sessionRecords = [...state.sessionRecords, createSessionRecord(state.lastSession)];
    }
    persist();
    render();
  }

  if (event.target.id === "protocol-form") {
    const run = activeProtocolRun();
    const definition = definitionForUi();
    if (!run || !definition) return;
    const step = definition.steps.find((item) => item.id === run.currentStepId);
    const value = event.target.elements.answer.value;
    const control = answerProtocolStep(state, { runId: run.id, stepId: step.id, value });
    if (!control.ok) {
      if (control.blocked) {
        showProtocolSafety(control.safetyMessage);
        return;
      }
      protocolUi.errorMessage = control.code === "required"
        ? "Cette réponse est obligatoire."
        : control.code === "too_long"
          ? `Votre réponse dépasse ${step.maxLength} caractères.`
          : "Cette réponse contient un caractère non pris en charge.";
      render();
      return;
    }
    state = control.state;
    persist();
    protocolUi.errorMessage = null;
    const updatedRun = state.protocolRuns.find((item) => item.id === run.id);
    const allReached = definition.steps.every((item) => Object.prototype.hasOwnProperty.call(updatedRun.answers || {}, item.id));
    protocolUi.screen = allReached ? "preview" : "run";
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
