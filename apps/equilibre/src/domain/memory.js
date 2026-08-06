import { detectSensitiveContent } from "../safety/sensitiveGuard.js";

export const MEMORY_STATUS = Object.freeze({
  proposed: "proposed",
  confirmed: "confirmed",
});

const nowIso = (now = new Date()) => new Date(now).toISOString();
const stableId = (prefix, now = new Date()) =>
  `${prefix}-${nowIso(now).replace(/[^0-9]/g, "").slice(0, 17)}-${Math.random().toString(36).slice(2, 8)}`;

export function createSessionRecord(session, { now = new Date() } = {}) {
  if (!session?.completed) throw new Error("Une séance terminée est requise.");
  const answers = { ...session.answers };
  const summary = [
    answers.situation && `Situation : ${answers.situation}`,
    answers.emotion && `Émotion : ${answers.emotion}`,
    answers.thought && `Pensée : ${answers.thought}`,
  ].filter(Boolean).join(" · ");
  return {
    id: stableId("session", now),
    sourceSessionId: session.id,
    createdAt: session.createdAt || nowIso(now),
    completedAt: nowIso(now),
    answers,
    summary,
    actionPlan: answers.action || "",
  };
}

export function proposeMemory({ content, sessionRecordId, sourceSessionId, kind = "insight", now = new Date() }) {
  const cleaned = String(content || "").trim();
  if (!cleaned) throw new Error("Le contenu de mémoire est requis.");
  if (!sessionRecordId) throw new Error("L'identifiant de l'enregistrement de séance est requis.");
  if (!sourceSessionId) throw new Error("L'identifiant de la séance source est requis.");
  return {
    id: stableId("memory", now),
    kind,
    content: cleaned,
    source: { type: "session", sessionRecordId, sourceSessionId },
    status: MEMORY_STATUS.proposed,
    createdAt: nowIso(now),
    updatedAt: nowIso(now),
  };
}

export function confirmMemory(entry, now = new Date()) {
  if (!entry) return entry;
  return { ...entry, status: MEMORY_STATUS.confirmed, updatedAt: nowIso(now) };
}

export function updateMemory(entry, content, now = new Date()) {
  const cleaned = String(content || "").trim();
  if (!entry || !cleaned) return entry;
  return { ...entry, content: cleaned, updatedAt: nowIso(now) };
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
  const cleaned = String(rawContent || "").trim();
  if (!cleaned || !entry) return { blocked: false, entry };
  if (detectSensitiveContent(cleaned)) return { blocked: true, entry };
  return { blocked: false, entry: updateMemory(entry, cleaned, now) };
}
