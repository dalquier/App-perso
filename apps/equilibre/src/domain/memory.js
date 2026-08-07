import { gateProtocolText } from "../safety/textGate.js";

export const MEMORY_STATUS = Object.freeze({
  proposed: "proposed",
  confirmed: "confirmed",
});

const nowIso = (now = new Date()) => new Date(now).toISOString();
const stableId = (prefix, now = new Date()) =>
  `${prefix}-${nowIso(now).replace(/[^0-9]/g, "").slice(0, 17)}-${Math.random().toString(36).slice(2, 8)}`;

function safetyError(gate, fallback = "Contenu refusé par le garde-fou.") {
  const error = new Error(gate?.safetyMessage || fallback);
  error.code = gate?.code || "invalid_text";
  error.blocked = Boolean(gate?.blocked);
  error.safetyMessage = gate?.safetyMessage || null;
  return error;
}

function gateMemoryText(rawContent, { required = true, maxLength = 4000 } = {}) {
  const gate = gateProtocolText(rawContent, { required, maxLength });
  if (!gate.ok) throw safetyError(gate, "Contenu de mémoire invalide.");
  return gate.value;
}

function assertLegacySessionSafe(session) {
  for (const value of Object.values(session?.answers || {})) {
    const gate = gateProtocolText(value, { required: false, maxLength: 1000 });
    if (!gate.ok) throw safetyError(gate, "Réponse de séance invalide.");
  }
}

export function createSessionRecord(session, { now = new Date() } = {}) {
  if (!session?.completed) throw new Error("Une séance terminée est requise.");
  assertLegacySessionSafe(session);
  const answers = { ...session.answers };
  const summary = [
    answers.situation && `Situation : ${answers.situation}`,
    answers.emotion && `Émotion : ${answers.emotion}`,
    answers.thought && `Pensée : ${answers.thought}`,
  ].filter(Boolean).join(" · ");
  const actionPlan = answers.action || "";
  gateMemoryText(summary, { required: false });
  gateMemoryText(actionPlan, { required: false, maxLength: 1000 });
  return {
    id: stableId("session", now),
    sourceSessionId: session.id,
    createdAt: session.createdAt || nowIso(now),
    completedAt: nowIso(now),
    answers,
    summary,
    actionPlan,
  };
}

export function proposeMemory({ content, sessionRecordId, sourceSessionId, kind = "insight", now = new Date() }) {
  const cleaned = gateMemoryText(content);
  if (kind === "action" && !cleaned) throw new Error("Une action non vide est requise pour proposer cette mémoire.");
  if (!sessionRecordId) throw new Error("L'identifiant de l'enregistrement de séance est requis.");
  if (!sourceSessionId) throw new Error("L'identifiant de la séance source est requis.");
  const source = Object.freeze({ type: "session", sessionRecordId, sourceSessionId });
  return Object.freeze({
    id: stableId("memory", now),
    kind,
    content: cleaned,
    source,
    status: MEMORY_STATUS.proposed,
    createdAt: nowIso(now),
    updatedAt: nowIso(now),
  });
}

export function confirmMemory(entry, now = new Date()) {
  if (!entry) return entry;
  gateMemoryText(entry.content);
  return Object.freeze({ ...entry, source: entry.source, status: MEMORY_STATUS.confirmed, updatedAt: nowIso(now) });
}

export function updateMemory(entry, content, now = new Date()) {
  if (!entry) return entry;
  const cleaned = gateMemoryText(content);
  return Object.freeze({ ...entry, source: entry.source, content: cleaned, updatedAt: nowIso(now) });
}

export function removeMemory(entries, id) {
  return entries.filter((entry) => entry.id !== id);
}

/**
 * Applique une correction de mémoire avec garde-fou sensible.
 * Retourne { blocked: true } si le contenu déclenche le garde-fou,
 * sinon { blocked: false, entry: <mémoire corrigée> }.
 */
export function applyMemoryCorrection(entry, rawContent, now = new Date()) {
  if (!entry) return { blocked: false, entry };
  const gate = gateProtocolText(rawContent, { required: true, maxLength: 4000 });
  if (!gate.ok) {
    if (gate.blocked) return { blocked: true, entry, safetyMessage: gate.safetyMessage };
    return { blocked: false, entry, rejected: true, code: gate.code };
  }
  return { blocked: false, entry: updateMemory(entry, gate.value, now) };
}
