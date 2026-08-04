import "./styles.css";
import { answerSession, createSession } from "./domain/session.js";
import { localReply } from "./providers/localSimulator.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "./safety/sensitiveGuard.js";
import { createStore } from "./storage/localStore.js";

const store = createStore();
let state = store.load();
let view = "home";
const app = document.querySelector("#app");

const escapeHtml = (value = "") => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const persist = () => store.save(state);
const setView = (next) => { view = next; render(); requestAnimationFrame(() => document.querySelector("main")?.focus()); };
const stepCopy = {
  situation: ["La situation", "Que s’est-il passé, simplement et factuellement ?", "Ex. : Une tâche prévue a été reportée."],
  emotion: ["L’émotion", "Quelle émotion est la plus présente ?", "Ex. : Inquiétude, 6 sur 10."],
  thought: ["La pensée", "Quelle pensée vous traverse dans cette situation ?", "Ex. : Je ne vais pas y arriver."],
  action: ["La prochaine action", "Quel tout petit pas réaliste pouvez-vous choisir ?", "Ex. : Ouvrir le document pendant deux minutes."],
};

function shell(content) {
  return `<div class="app-shell">
    <header class="topbar"><button class="brand" data-view="home" aria-label="Retour à l’accueil"><span class="brand-mark">É</span><span>Équilibre</span></button><button class="icon-button" data-view="settings" aria-label="Réglages"><span aria-hidden="true">•••</span></button></header>
    <main tabindex="-1">${content}</main>
    <nav class="tabbar" aria-label="Navigation principale">
      <button class="tab ${view === "home" ? "active" : ""}" data-view="home"><span>⌂</span>Accueil</button>
      <button class="tab ${view === "chat" ? "active" : ""}" data-view="chat"><span>◌</span>Échanger</button>
      <button class="tab ${view === "session" ? "active" : ""}" data-view="session"><span>◇</span>Séance</button>
    </nav>
  </div>`;
}

function homeView() {
  const resumable = state.lastSession && !state.lastSession.completed;
  return `<section class="hero"><p class="eyebrow">Votre espace, ici et maintenant</p><h1>Comment souhaitez-vous<br><em>prendre soin de vous ?</em></h1><p class="lead">Un moment pour clarifier ce qui se passe et choisir un prochain pas — sans jugement.</p></section>
    ${resumable ? `<button class="resume-card" data-view="session"><span><small>À reprendre</small><strong>Votre séance en cours</strong></span><span aria-hidden="true">→</span></button>` : ""}
    <section class="choices" aria-label="Choisir un parcours">
      <button class="choice-card primary" data-view="chat"><span class="choice-icon">✦</span><span><strong>Échanger librement</strong><small>Écrire ce qui vous traverse</small></span><span>→</span></button>
      <button class="choice-card" data-start-session><span class="choice-icon">◇</span><span><strong>Faire une séance guidée</strong><small>4 étapes · environ 5 minutes</small></span><span>→</span></button>
    </section>
    <aside class="local-note"><span>⌾</span><p><strong>Privé par conception</strong><br>Tout reste sur cet appareil. Aucun compte, aucun envoi distant.</p></aside>
    <p class="disclaimer">Équilibre est un outil d’auto-accompagnement inspiré des TCC. Il ne pose aucun diagnostic et ne remplace pas un professionnel.</p>`;
}

function chatView() {
  const messages = state.messages.map((m) => `<div class="message ${m.role}"><small>${m.role === "user" ? "Vous" : "Équilibre · simulateur local"}</small><p>${escapeHtml(m.content)}</p></div>`).join("");
  return `<section class="page-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">Mode local</p><h1>Échanger</h1></div></section>
    <div class="chat-log" aria-live="polite">${messages || `<div class="empty-state"><span>✦</span><h2>Posez ce qui est là</h2><p>Quelques mots suffisent. Le simulateur répond localement et ne contacte aucun service distant.</p></div>`}</div>
    <form class="composer" id="chat-form"><label class="sr-only" for="chat-input">Votre message</label><textarea id="chat-input" maxlength="1500" rows="1" placeholder="Écrivez ici…" required></textarea><button type="submit" aria-label="Envoyer">↑</button></form>`;
}

function sessionView() {
  if (!state.lastSession) state.lastSession = createSession();
  const session = state.lastSession;
  if (session.completed) return `<section class="complete"><span class="complete-mark">✓</span><p class="eyebrow">Séance terminée</p><h1>Un pas à la fois.</h1><p>Vous avez clarifié la situation et choisi une action concrète.</p><dl>${Object.entries(session.answers).map(([key, value]) => `<div><dt>${stepCopy[key][0]}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><button class="button primary-button" data-view="home">Revenir à l’accueil</button><button class="text-button" data-start-session>Commencer une nouvelle séance</button></section>`;
  const index = ["situation", "emotion", "thought", "action"].indexOf(session.step);
  const copy = stepCopy[session.step];
  return `<section class="session-head"><button class="back" data-view="home">×</button><span>Étape ${index + 1} sur 4</span><span>${Math.round(((index + 1) / 4) * 100)} %</span></section><div class="progress"><i style="width:${((index + 1) / 4) * 100}%"></i></div>
    <section class="session-card"><span class="session-number">0${index + 1}</span><p class="eyebrow">${copy[0]}</p><h1>${copy[1]}</h1><p>Restez bref si vous le souhaitez. Il n’y a pas de bonne réponse.</p><form id="session-form"><label class="sr-only" for="session-input">${copy[0]}</label><textarea id="session-input" rows="5" maxlength="1000" placeholder="${copy[2]}" required></textarea><button class="button primary-button" type="submit">Continuer <span>→</span></button></form></section>`;
}

function settingsView() {
  return `<section class="page-heading"><button class="back" data-view="home">←</button><div><p class="eyebrow">Vos choix</p><h1>Confidentialité</h1></div></section>
    <section class="settings-list"><label class="setting"><span><strong>Enregistrer sur cet appareil</strong><small>Désactiver efface les données sauvegardées.</small></span><input id="save-setting" type="checkbox" ${state.settings.saveLocally ? "checked" : ""}></label>
    <label class="setting"><span><strong>Apparence</strong><small>Clair, sombre ou réglage de l’iPhone.</small></span><select id="theme-setting"><option value="system">Système</option><option value="light">Clair</option><option value="dark">Sombre</option></select></label></section>
    <section class="danger-zone"><h2>Vos données</h2><p>Supprime définitivement les échanges, la séance et les réglages enregistrés par Équilibre dans ce navigateur.</p><button id="clear-data" class="danger-button">Effacer toutes mes données</button></section>
    <p class="privacy-copy">Aucune donnée n’est envoyée à un serveur dans cette version. Effacer les données est irréversible.</p>`;
}

function render() {
  const content = view === "chat" ? chatView() : view === "session" ? sessionView() : view === "settings" ? settingsView() : homeView();
  app.innerHTML = shell(content);
  document.documentElement.dataset.theme = state.settings.theme;
  const themeSelect = document.querySelector("#theme-setting");
  if (themeSelect) themeSelect.value = state.settings.theme;
}

app.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);
  if (event.target.closest("[data-start-session]")) { state.lastSession = createSession(); persist(); setView("session"); }
  if (event.target.closest("#clear-data")) {
    if (confirm("Effacer définitivement toutes les données locales d’Équilibre ?")) { store.clear(); state = { ...store.load() }; setView("home"); }
  }
});

app.addEventListener("change", (event) => {
  if (event.target.id === "save-setting") {
    state.settings.saveLocally = event.target.checked;
    if (!event.target.checked) store.clear(); else persist();
    render();
  }
  if (event.target.id === "theme-setting") { state.settings.theme = event.target.value; persist(); render(); }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "chat-form") {
    const input = event.target.elements[0];
    const content = input.value.trim();
    if (!content) return;
    const userMessage = { id: `user-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() };
    const reply = detectSensitiveContent(content) ? { id: `safety-${Date.now()}`, role: "assistant", content: SAFETY_MESSAGE, createdAt: new Date().toISOString(), provider: "safety-guard" } : localReply(content, state.messages.length);
    state.messages.push(userMessage, reply); persist(); render(); document.querySelector("#chat-input")?.focus();
  }
  if (event.target.id === "session-form") {
    const value = event.target.elements[0].value;
    if (detectSensitiveContent(value)) { alert(SAFETY_MESSAGE); return; }
    state.lastSession = answerSession(state.lastSession, value); persist(); render();
  }
});

render();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
