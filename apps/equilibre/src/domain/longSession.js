import {
  LONG_SESSION_DEFINITION_SCHEMA_VERSION,
  LONG_SESSION_INTERACTION_MODES,
  LONG_SESSION_KIND,
  LONG_SESSION_PHASES,
  deepFreezeContract,
} from "../protocols/longSessionDefinition.js";

export const LONG_SESSION_RUN_SCHEMA_VERSION = 1;

export const LONG_SESSION_STATUS = Object.freeze({
  draft: "draft",
  completed: "completed",
});

export const LONG_SESSION_ACTIVITY_STATE = Object.freeze({
  active: "active",
  paused: "paused",
});

export const LONG_SESSION_SAFETY_STATE = Object.freeze({
  normal: "normal",
  interrupted: "interrupted",
});

export const LONG_SESSION_COMPLETION_MODE = Object.freeze({
  normal: "normal",
  early: "early",
});

export const LONG_SESSION_TURN_STATUS = Object.freeze({
  complete: "complete",
  generating: "generating",
  partial: "partial",
  interrupted: "interrupted",
  error: "error",
});

export const LONG_SESSION_MODALITY = Object.freeze({
  text: "text",
  voice: "voice",
});

export const LONG_SESSION_PHASE_STATUS = Object.freeze({
  pending: "pending",
  active: "active",
  completed: "completed",
});

export const LONG_SESSION_ANCHOR_STATUS = Object.freeze({
  proposed: "proposed",
  confirmed: "confirmed",
});

export const LONG_SESSION_TRANSITIONS = deepFreezeContract({
  "draft:active:normal": [
    "draft:paused:normal",
    "draft:paused:interrupted",
    "completed:paused:normal",
  ],
  "draft:paused:normal": [
    "draft:active:normal",
    "draft:paused:interrupted",
    "completed:paused:normal",
  ],
  "draft:paused:interrupted": [
    "draft:paused:normal",
  ],
  "completed:paused:normal": [],
});

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isIsoDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const isNullableIsoDate = (value) => value === null || isIsoDate(value);
const isHexDigest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const isLongSessionProtocolId = (value) => nonEmptyString(value) && value.startsWith("equilibre.long-session.");

function clone(value) {
  return structuredClone(value);
}

function assertJsonValue(value, path) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return;
  if (typeof value === "function" || typeof value === "undefined" || typeof value === "symbol" || typeof value === "bigint") {
    throw new TypeError(`${path}: valeur non sérialisable interdite.`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${path}[${index}]`));
    return;
  }
  if (!isObject(value)) throw new TypeError(`${path}: valeur JSON invalide.`);
  for (const [key, child] of Object.entries(value)) assertJsonValue(child, `${path}.${key}`);
}

function stateKey(run) {
  return `${run.status}:${run.activityState}:${run.safetyState}`;
}

export function isLongSessionStateTransitionAllowed(from, to) {
  if (!isObject(from) || !isObject(to)) return false;
  return (LONG_SESSION_TRANSITIONS[stateKey(from)] || []).includes(stateKey(to));
}

function validatePhaseProgress(run) {
  if (!Array.isArray(run.phaseProgress) || run.phaseProgress.length !== LONG_SESSION_PHASES.length) {
    throw new TypeError("phaseProgress doit contenir exactement les sept phases canoniques.");
  }
  const statuses = new Set(Object.values(LONG_SESSION_PHASE_STATUS));
  let activeCount = 0;
  run.phaseProgress.forEach((progress, index) => {
    if (!isObject(progress)) throw new TypeError(`phaseProgress[${index}] invalide.`);
    const canonical = LONG_SESSION_PHASES[index];
    if (progress.phaseId !== canonical.id) throw new TypeError(`Progression attendue pour ${canonical.id}.`);
    if (!statuses.has(progress.status)) throw new TypeError(`Statut de phase invalide: ${progress.status}.`);
    if (!isNullableIsoDate(progress.startedAt) || !isNullableIsoDate(progress.completedAt)) {
      throw new TypeError(`Horodatage de phase invalide: ${progress.phaseId}.`);
    }
    if (progress.status === LONG_SESSION_PHASE_STATUS.pending && (progress.startedAt || progress.completedAt)) {
      throw new TypeError(`Une phase en attente ne porte pas d’horodatage: ${progress.phaseId}.`);
    }
    if (progress.status === LONG_SESSION_PHASE_STATUS.active) {
      activeCount += 1;
      if (!progress.startedAt || progress.completedAt) throw new TypeError(`Phase active incohérente: ${progress.phaseId}.`);
    }
    if (progress.status === LONG_SESSION_PHASE_STATUS.completed && (!progress.startedAt || !progress.completedAt)) {
      throw new TypeError(`Phase terminée incomplète: ${progress.phaseId}.`);
    }
  });

  const current = run.phaseProgress.find((item) => item.phaseId === run.currentPhaseId);
  if (!current) throw new TypeError(`currentPhaseId inconnu: ${run.currentPhaseId}.`);
  if (run.status === LONG_SESSION_STATUS.draft && (activeCount !== 1 || current.status !== LONG_SESSION_PHASE_STATUS.active)) {
    throw new TypeError("Un draft doit posséder exactement une phase active, égale à currentPhaseId.");
  }
  if (run.status === LONG_SESSION_STATUS.completed && activeCount !== 0) {
    throw new TypeError("Une séance terminée ne conserve aucune phase active.");
  }
}

function validateTiming(run) {
  const timing = run.timing;
  if (!isObject(timing)
    || !Number.isInteger(timing.activeElapsedMs)
    || timing.activeElapsedMs < 0
    || !isNullableIsoDate(timing.activeSince)
    || !isNullableIsoDate(timing.pausedAt)
    || !isNullableIsoDate(timing.lastActivityAt)) {
    throw new TypeError("timing est invalide.");
  }
  if (run.activityState === LONG_SESSION_ACTIVITY_STATE.active) {
    if (!timing.activeSince || timing.pausedAt) throw new TypeError("Une séance active exige activeSince et aucun pausedAt.");
  } else if (timing.activeSince) {
    throw new TypeError("Une séance en pause ne doit pas conserver activeSince.");
  }
}

function validateTurns(run) {
  if (!Array.isArray(run.turns)) throw new TypeError("turns doit être une liste.");
  const ids = new Set();
  const phaseIds = new Set(LONG_SESSION_PHASES.map(({ id }) => id));
  const statuses = new Set(Object.values(LONG_SESSION_TURN_STATUS));
  const modalities = new Set(Object.values(LONG_SESSION_MODALITY));
  for (const [index, turn] of run.turns.entries()) {
    if (!isObject(turn) || !nonEmptyString(turn.id) || ids.has(turn.id)) throw new TypeError(`Turn invalide ou dupliqué à l’index ${index}.`);
    ids.add(turn.id);
    if (!phaseIds.has(turn.phaseId)) throw new TypeError(`phaseId de turn inconnu: ${turn.phaseId}.`);
    if (!["user", "assistant"].includes(turn.role)) throw new TypeError(`Rôle de turn invalide: ${turn.role}.`);
    if (typeof turn.content !== "string") throw new TypeError("Le contenu canonique d’un turn doit être textuel.");
    if (!isIsoDate(turn.createdAt) || !statuses.has(turn.status) || !modalities.has(turn.modality)) {
      throw new TypeError(`Métadonnées de turn invalides: ${turn.id}.`);
    }
    if (turn.provider !== undefined && turn.provider !== null && !nonEmptyString(turn.provider)) {
      throw new TypeError(`provider invalide pour le turn ${turn.id}.`);
    }
  }
}

function validateAnchors(run) {
  if (!isObject(run.anchors)) throw new TypeError("anchors doit être un objet.");
  const statuses = new Set(Object.values(LONG_SESSION_ANCHOR_STATUS));
  const turnIds = new Set(run.turns.map(({ id }) => id));
  for (const [key, anchor] of Object.entries(run.anchors)) {
    if (!nonEmptyString(key) || !isObject(anchor) || !statuses.has(anchor.status) || !isIsoDate(anchor.updatedAt)) {
      throw new TypeError(`Anchor invalide: ${key}.`);
    }
    assertJsonValue(anchor.value, `anchors.${key}.value`);
    if (!Array.isArray(anchor.sourceTurnIds) || !anchor.sourceTurnIds.every((id) => turnIds.has(id))) {
      throw new TypeError(`Provenance de l’anchor invalide: ${key}.`);
    }
    if (anchor.status === LONG_SESSION_ANCHOR_STATUS.proposed && anchor.confirmedAt !== null) {
      throw new TypeError(`Un anchor proposé ne peut pas être confirmé: ${key}.`);
    }
    if (anchor.status === LONG_SESSION_ANCHOR_STATUS.confirmed && !isIsoDate(anchor.confirmedAt)) {
      throw new TypeError(`Un anchor confirmé exige confirmedAt: ${key}.`);
    }
  }
}

function validateOriginRef(originRef) {
  if (originRef === undefined || originRef === null) return;
  if (!isObject(originRef) || originRef.type !== "conversation" || !nonEmptyString(originRef.conversationId)) {
    throw new TypeError("originRef doit référencer explicitement une conversation.");
  }
  if (originRef.messageId !== undefined && !nonEmptyString(originRef.messageId)) {
    throw new TypeError("originRef.messageId doit être une chaîne non vide.");
  }
}

function validateResult(run) {
  if (run.status === LONG_SESSION_STATUS.draft) {
    if (run.result !== undefined || run.sessionRecordId !== undefined || run.completedAt !== undefined) {
      throw new TypeError("Un draft ne possède ni résultat, ni sessionRecordId, ni completedAt.");
    }
    return;
  }

  if (!isObject(run.result) || !Object.values(LONG_SESSION_COMPLETION_MODE).includes(run.result.completionMode)) {
    throw new TypeError("Une séance terminée exige un résultat et un completionMode valides.");
  }
  if (!nonEmptyString(run.result.summary) || typeof run.result.actionPlan !== "string" && run.result.actionPlan !== null) {
    throw new TypeError("Le résultat exige une synthèse et accepte une action nullable.");
  }
  if (!Array.isArray(run.result.sourceTurnIds) || !run.result.sourceTurnIds.every(nonEmptyString)) {
    throw new TypeError("result.sourceTurnIds doit être une liste d’identifiants.");
  }
  const turnIds = new Set(run.turns.map(({ id }) => id));
  if (!run.result.sourceTurnIds.every((id) => turnIds.has(id))) {
    throw new TypeError("result.sourceTurnIds doit référencer des turns existants.");
  }
  if (run.result.userConfirmed !== true || !isIsoDate(run.result.confirmedAt) || !isIsoDate(run.completedAt)) {
    throw new TypeError("Le résultat final doit être confirmé et horodaté.");
  }
  if (run.sessionRecordId !== undefined && !nonEmptyString(run.sessionRecordId)) {
    throw new TypeError("sessionRecordId doit être une chaîne non vide lorsqu’il est présent.");
  }
}

export function validateLongSessionRun(input) {
  if (!isObject(input)) throw new TypeError("LongSessionRun invalide.");
  const run = clone(input);
  const modes = new Set(Object.values(LONG_SESSION_INTERACTION_MODES));
  const statuses = new Set(Object.values(LONG_SESSION_STATUS));
  const activityStates = new Set(Object.values(LONG_SESSION_ACTIVITY_STATE));
  const safetyStates = new Set(Object.values(LONG_SESSION_SAFETY_STATE));

  if (run.schemaVersion !== LONG_SESSION_RUN_SCHEMA_VERSION) throw new TypeError("schemaVersion de run invalide.");
  if (run.definitionSchemaVersion !== LONG_SESSION_DEFINITION_SCHEMA_VERSION) throw new TypeError("definitionSchemaVersion invalide.");
  if (run.runKind !== LONG_SESSION_KIND) throw new TypeError(`runKind doit valoir ${LONG_SESSION_KIND}.`);
  if (!nonEmptyString(run.id) || !isLongSessionProtocolId(run.protocolId) || !/^\d+\.\d+\.\d+$/.test(run.protocolVersion)) {
    throw new TypeError("Identité/version du run invalide.");
  }
  if (!isHexDigest(run.definitionDigest)) throw new TypeError("definitionDigest doit être un SHA-256 hexadécimal.");
  if (!modes.has(run.interactionMode) || !statuses.has(run.status)
    || !activityStates.has(run.activityState) || !safetyStates.has(run.safetyState)) {
    throw new TypeError("Mode ou état de run invalide.");
  }
  if (!isIsoDate(run.startedAt) || !isIsoDate(run.updatedAt) || !Number.isInteger(run.revision) || run.revision < 0) {
    throw new TypeError("Métadonnées de run invalides.");
  }
  if (run.status === LONG_SESSION_STATUS.completed && run.activityState !== LONG_SESSION_ACTIVITY_STATE.paused) {
    throw new TypeError("Une séance terminée ne peut pas rester active.");
  }
  if (run.safetyState === LONG_SESSION_SAFETY_STATE.interrupted && run.activityState !== LONG_SESSION_ACTIVITY_STATE.paused) {
    throw new TypeError("Une interruption safety suspend nécessairement la séance.");
  }
  if (!Object.prototype.hasOwnProperty.call(LONG_SESSION_TRANSITIONS, stateKey(run))) {
    throw new TypeError("Combinaison d’état de séance longue invalide.");
  }

  validatePhaseProgress(run);
  validateTiming(run);
  validateTurns(run);
  validateAnchors(run);
  validateOriginRef(run.originRef);
  validateResult(run);
  assertJsonValue(run, "run");

  return deepFreezeContract(run);
}

export function validateLongSessionRecord(input) {
  if (!isObject(input)) throw new TypeError("SessionRecord long invalide.");
  const record = clone(input);
  if (!nonEmptyString(record.id) || record.recordType !== "long-session" || !nonEmptyString(record.sourceSessionId)) {
    throw new TypeError("Identité du SessionRecord long invalide.");
  }
  if (!isObject(record.protocolRef)
    || !isLongSessionProtocolId(record.protocolRef.id)
    || !/^\d+\.\d+\.\d+$/.test(record.protocolRef.version)
    || !isHexDigest(record.protocolRef.definitionDigest)) {
    throw new TypeError("protocolRef du SessionRecord long invalide.");
  }
  if (!isIsoDate(record.createdAt) || !isIsoDate(record.completedAt)
    || !Object.values(LONG_SESSION_COMPLETION_MODE).includes(record.completionMode)) {
    throw new TypeError("Clôture du SessionRecord long invalide.");
  }
  if (!nonEmptyString(record.summary) || typeof record.actionPlan !== "string" && record.actionPlan !== null) {
    throw new TypeError("Le SessionRecord exige une synthèse et accepte une action nullable.");
  }
  if (!Array.isArray(record.sourceTurnIds) || !record.sourceTurnIds.every(nonEmptyString)) {
    throw new TypeError("sourceTurnIds du SessionRecord long invalide.");
  }
  assertJsonValue(record, "sessionRecord");
  return deepFreezeContract(record);
}
