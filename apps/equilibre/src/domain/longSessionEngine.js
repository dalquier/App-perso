import { protocolDefinitionDigest } from "../protocols/digest.js";
import {
  LONG_SESSION_INTERACTION_MODES,
  LONG_SESSION_PHASES,
  validateLongSessionDefinition,
} from "../protocols/longSessionDefinition.js";
import { gateProtocolText } from "../safety/textGate.js";
import {
  LONG_SESSION_ACTIVITY_STATE,
  LONG_SESSION_ANCHOR_STATUS,
  LONG_SESSION_COMPLETION_MODE,
  LONG_SESSION_MODALITY,
  LONG_SESSION_PHASE_STATUS,
  LONG_SESSION_RUN_SCHEMA_VERSION,
  LONG_SESSION_SAFETY_STATE,
  LONG_SESSION_STATUS,
  LONG_SESSION_TURN_STATUS,
  validateLongSessionRun,
} from "./longSession.js";

const SUMMARY_MAX_LENGTH = 4_000;
const ACTION_MAX_LENGTH = 1_500;

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const randomId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

function clone(value) {
  return structuredClone(value);
}

function immutable(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) immutable(child);
  return Object.freeze(value);
}

function timestamp(now) {
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) throw new TypeError("Horodatage de séance longue invalide.");
  return date.toISOString();
}

function timestampMs(value) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new TypeError("Horodatage de séance longue invalide.");
  return parsed;
}

function assertChronology(run, at) {
  const atMs = timestampMs(at);
  if (atMs < timestampMs(run.updatedAt)) {
    throw new Error("Une opération de séance longue ne peut pas remonter le temps.");
  }
  if (run.timing.activeSince && atMs < timestampMs(run.timing.activeSince)) {
    throw new Error("Une opération de séance longue précède le début de la période active.");
  }
  return atMs;
}

function assertDefinitionMatches(run, definition) {
  if (run.protocolId !== definition.id || run.protocolVersion !== definition.version) {
    throw new Error(`Définition incompatible avec le run: ${run.protocolId}@${run.protocolVersion}.`);
  }
}

function assertDraft(run) {
  if (run.status === LONG_SESSION_STATUS.completed) throw new Error("Une séance longue terminée est immuable.");
  if (run.status !== LONG_SESSION_STATUS.draft) throw new Error(`Statut de séance longue invalide: ${run.status}.`);
}

function assertActiveNormal(run) {
  assertDraft(run);
  if (run.activityState !== LONG_SESSION_ACTIVITY_STATE.active) throw new Error("La séance longue doit être reprise avant cette opération.");
  if (run.safetyState !== LONG_SESSION_SAFETY_STATE.normal) throw new Error("L’interruption safety doit être levée avant cette opération.");
}

function structuredPhases(definition) {
  return definition.phases.map((phase) => ({
    phaseId: phase.id,
    prompts: phase.prompts,
  }));
}

function allPrompts(definition) {
  return definition.phases.flatMap((phase) => phase.prompts);
}

function phaseFor(definition, phaseId) {
  const phase = definition.phases.find((item) => item.id === phaseId);
  if (!phase) throw new Error(`Phase de séance longue inconnue: ${phaseId}.`);
  return phase;
}

function confirmedAnchor(run, anchorKey) {
  const anchor = run.anchors[anchorKey];
  return anchor?.status === LONG_SESSION_ANCHOR_STATUS.confirmed ? anchor : null;
}

function requiredPromptKeys(phase) {
  return phase.prompts.filter(({ required }) => required).map(({ anchorKey }) => anchorKey);
}

function accrueActiveTime(run, at) {
  if (run.activityState !== LONG_SESSION_ACTIVITY_STATE.active) return run.timing.activeElapsedMs;
  return run.timing.activeElapsedMs + assertChronology(run, at) - timestampMs(run.timing.activeSince);
}

function nextRevision(run, updates, at) {
  return validateLongSessionRun({
    ...clone(run),
    ...updates,
    updatedAt: at,
    revision: run.revision + 1,
  });
}

function pauseTiming(run, at) {
  return {
    ...clone(run.timing),
    activeElapsedMs: accrueActiveTime(run, at),
    activeSince: null,
    pausedAt: at,
    lastActivityAt: at,
  };
}

function interruptWithoutContentMutation(run, at) {
  if (run.safetyState === LONG_SESSION_SAFETY_STATE.interrupted) return run;
  assertChronology(run, at);
  return nextRevision(run, {
    activityState: LONG_SESSION_ACTIVITY_STATE.paused,
    safetyState: LONG_SESSION_SAFETY_STATE.interrupted,
    timing: pauseTiming(run, at),
  }, at);
}

export function validateStructuredLongSessionDefinition(input) {
  const definition = validateLongSessionDefinition(input);
  if (definition.supportedInteractionModes.length !== 1
    || definition.supportedInteractionModes[0] !== LONG_SESSION_INTERACTION_MODES.structured) {
    throw new TypeError("Le premier moteur long accepte uniquement une définition structured.");
  }

  const anchorKeys = new Set();
  for (const phase of definition.phases) {
    if (!Array.isArray(phase.prompts)) throw new TypeError(`Prompts structurés manquants pour ${phase.id}.`);
    for (const [index, prompt] of phase.prompts.entries()) {
      if (!isObject(prompt)
        || !nonEmptyString(prompt.anchorKey)
        || anchorKeys.has(prompt.anchorKey)
        || !nonEmptyString(prompt.label)
        || !nonEmptyString(prompt.question)
        || typeof prompt.required !== "boolean"
        || !Number.isInteger(prompt.maxLength)
        || prompt.maxLength <= 0) {
        throw new TypeError(`Prompt structuré invalide ou dupliqué: ${phase.id}[${index}].`);
      }
      anchorKeys.add(prompt.anchorKey);
    }
  }

  if (!Array.isArray(definition.summaryContract.sections) || definition.summaryContract.sections.length === 0) {
    throw new TypeError("Le moteur structuré exige des sections de synthèse déclaratives.");
  }
  for (const [index, section] of definition.summaryContract.sections.entries()) {
    if (!isObject(section)
      || !nonEmptyString(section.label)
      || !anchorKeys.has(section.anchorKey)
      || typeof section.omitWhenEmpty !== "boolean") {
      throw new TypeError(`Section de synthèse structurée invalide: ${index}.`);
    }
  }
  if (!anchorKeys.has(definition.actionContract.anchorKey)) {
    throw new TypeError("actionContract.anchorKey doit référencer un prompt structuré.");
  }

  return definition;
}

export async function createLongSessionRun({
  definition,
  interactionMode = LONG_SESSION_INTERACTION_MODES.structured,
  originRef,
  existingGuidedRuns = [],
  now = new Date(),
  idFactory = () => randomId("long-session"),
} = {}) {
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  if (interactionMode !== LONG_SESSION_INTERACTION_MODES.structured) {
    throw new Error("Le dialogue semi-structuré n’est pas disponible dans SESSION-30-B.");
  }
  if (!Array.isArray(existingGuidedRuns)) throw new TypeError("existingGuidedRuns doit être une liste.");
  if (existingGuidedRuns.some((run) => run?.status === LONG_SESSION_STATUS.draft)) {
    throw new Error("Une activité guidée est déjà en cours.");
  }
  const startedAt = timestamp(now);
  const phaseProgress = LONG_SESSION_PHASES.map((phase, index) => ({
    phaseId: phase.id,
    status: index === 0 ? LONG_SESSION_PHASE_STATUS.active : LONG_SESSION_PHASE_STATUS.pending,
    startedAt: index === 0 ? startedAt : null,
    completedAt: null,
  }));
  const run = {
    schemaVersion: LONG_SESSION_RUN_SCHEMA_VERSION,
    definitionSchemaVersion: validatedDefinition.schemaVersion,
    id: idFactory(),
    protocolId: validatedDefinition.id,
    protocolVersion: validatedDefinition.version,
    definitionDigest: await protocolDefinitionDigest(validatedDefinition),
    runKind: validatedDefinition.kind,
    interactionMode,
    status: LONG_SESSION_STATUS.draft,
    activityState: LONG_SESSION_ACTIVITY_STATE.active,
    safetyState: LONG_SESSION_SAFETY_STATE.normal,
    currentPhaseId: LONG_SESSION_PHASES[0].id,
    phaseProgress,
    turns: [],
    anchors: {},
    timing: {
      activeElapsedMs: 0,
      activeSince: startedAt,
      pausedAt: null,
      lastActivityAt: startedAt,
    },
    startedAt,
    updatedAt: startedAt,
    revision: 0,
    ...(originRef ? { originRef: clone(originRef) } : {}),
  };
  return validateLongSessionRun(run);
}

export function getStructuredLongSessionState(runInput, { definition } = {}) {
  const run = validateLongSessionRun(runInput);
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  const phase = phaseFor(validatedDefinition, run.currentPhaseId);
  const missingRequiredAnchorKeys = requiredPromptKeys(phase).filter((key) => !confirmedAnchor(run, key));
  const remainingPrompts = phase.prompts.filter(({ anchorKey }) => !confirmedAnchor(run, anchorKey));
  return immutable({
    phaseId: phase.id,
    phaseLabel: phase.label,
    currentPrompt: remainingPrompts[0] || null,
    remainingPromptKeys: remainingPrompts.map(({ anchorKey }) => anchorKey),
    missingRequiredAnchorKeys,
    canAdvance: missingRequiredAnchorKeys.length === 0 && phase.id !== LONG_SESSION_PHASES.at(-1).id,
    canCompleteNormally: missingRequiredAnchorKeys.length === 0 && phase.id === LONG_SESSION_PHASES.at(-1).id,
  });
}

export function submitLongSessionAnswer(runInput, {
  definition,
  anchorKey,
  content,
  confirm = false,
  now = new Date(),
  idFactory = () => randomId("long-turn"),
  sensitiveDetector,
} = {}) {
  const run = validateLongSessionRun(runInput);
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  assertActiveNormal(run);
  const phase = phaseFor(validatedDefinition, run.currentPhaseId);
  const prompt = phase.prompts.find((item) => item.anchorKey === anchorKey);
  if (!prompt) throw new Error(`Réponse non autorisée dans la phase ${phase.id}: ${anchorKey}.`);

  const gate = gateProtocolText(content, {
    required: prompt.required,
    maxLength: prompt.maxLength,
    ...(sensitiveDetector ? { sensitiveDetector } : {}),
  });
  if (!gate.ok) {
    if (!gate.blocked) return gate;
    const at = timestamp(now);
    return immutable({
      ...gate,
      run: interruptWithoutContentMutation(run, at),
    });
  }

  const at = timestamp(now);
  assertChronology(run, at);
  const turnId = idFactory();
  if (!nonEmptyString(turnId) || run.turns.some(({ id }) => id === turnId)) {
    throw new Error("Identifiant de turn long invalide ou dupliqué.");
  }
  const turn = {
    id: turnId,
    phaseId: phase.id,
    role: "user",
    content: gate.value,
    createdAt: at,
    status: LONG_SESSION_TURN_STATUS.complete,
    modality: LONG_SESSION_MODALITY.text,
  };
  const anchor = {
    status: confirm ? LONG_SESSION_ANCHOR_STATUS.confirmed : LONG_SESSION_ANCHOR_STATUS.proposed,
    value: gate.value,
    sourceTurnIds: [turnId],
    updatedAt: at,
    confirmedAt: confirm ? at : null,
  };
  const updatedRun = nextRevision(run, {
    turns: [...clone(run.turns), turn],
    anchors: { ...clone(run.anchors), [anchorKey]: anchor },
    timing: { ...clone(run.timing), lastActivityAt: at },
  }, at);
  return immutable({
    ok: true,
    blocked: false,
    status: confirm ? "confirmed" : "proposed",
    run: updatedRun,
    turn: updatedRun.turns.at(-1),
    anchor: updatedRun.anchors[anchorKey],
  });
}

export function confirmLongSessionAnchor(runInput, {
  definition,
  anchorKey,
  now = new Date(),
} = {}) {
  const run = validateLongSessionRun(runInput);
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  assertActiveNormal(run);
  const phase = phaseFor(validatedDefinition, run.currentPhaseId);
  if (!phase.prompts.some((prompt) => prompt.anchorKey === anchorKey)) {
    throw new Error(`Anchor non confirmable dans la phase ${phase.id}: ${anchorKey}.`);
  }
  const anchor = run.anchors[anchorKey];
  if (!anchor) throw new Error(`Anchor introuvable: ${anchorKey}.`);
  if (anchor.status === LONG_SESSION_ANCHOR_STATUS.confirmed) return run;
  const at = timestamp(now);
  assertChronology(run, at);
  return nextRevision(run, {
    anchors: {
      ...clone(run.anchors),
      [anchorKey]: {
        ...clone(anchor),
        status: LONG_SESSION_ANCHOR_STATUS.confirmed,
        updatedAt: at,
        confirmedAt: at,
      },
    },
    timing: { ...clone(run.timing), lastActivityAt: at },
  }, at);
}

export function advanceLongSessionPhase(runInput, {
  definition,
  now = new Date(),
} = {}) {
  const run = validateLongSessionRun(runInput);
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  assertActiveNormal(run);
  const state = getStructuredLongSessionState(run, { definition: validatedDefinition });
  if (state.missingRequiredAnchorKeys.length > 0) {
    throw new Error(`Anchors requis non confirmés: ${state.missingRequiredAnchorKeys.join(", ")}.`);
  }
  const currentIndex = validatedDefinition.phases.findIndex(({ id }) => id === run.currentPhaseId);
  if (currentIndex >= validatedDefinition.phases.length - 1) {
    throw new Error("La phase de clôture doit être terminée par une confirmation de synthèse.");
  }
  const at = timestamp(now);
  assertChronology(run, at);
  const nextPhase = validatedDefinition.phases[currentIndex + 1];
  const phaseProgress = run.phaseProgress.map((progress, index) => {
    if (index === currentIndex) return { ...clone(progress), status: LONG_SESSION_PHASE_STATUS.completed, completedAt: at };
    if (index === currentIndex + 1) {
      return { ...clone(progress), status: LONG_SESSION_PHASE_STATUS.active, startedAt: at, completedAt: null };
    }
    return clone(progress);
  });
  return nextRevision(run, {
    currentPhaseId: nextPhase.id,
    phaseProgress,
    timing: { ...clone(run.timing), lastActivityAt: at },
  }, at);
}

export function moveLongSessionBack(runInput, {
  definition,
  now = new Date(),
} = {}) {
  const run = validateLongSessionRun(runInput);
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  assertActiveNormal(run);
  const currentIndex = validatedDefinition.phases.findIndex(({ id }) => id === run.currentPhaseId);
  if (currentIndex <= 0) return run;
  const at = timestamp(now);
  assertChronology(run, at);
  const targetIndex = currentIndex - 1;
  const phaseProgress = run.phaseProgress.map((progress, index) => {
    if (index < targetIndex) return clone(progress);
    if (index === targetIndex) {
      return {
        ...clone(progress),
        status: LONG_SESSION_PHASE_STATUS.active,
        startedAt: progress.startedAt || at,
        completedAt: null,
      };
    }
    return { phaseId: progress.phaseId, status: LONG_SESSION_PHASE_STATUS.pending, startedAt: null, completedAt: null };
  });
  return nextRevision(run, {
    currentPhaseId: validatedDefinition.phases[targetIndex].id,
    phaseProgress,
    timing: { ...clone(run.timing), lastActivityAt: at },
  }, at);
}

export function pauseLongSessionRun(runInput, { now = new Date() } = {}) {
  const run = validateLongSessionRun(runInput);
  assertDraft(run);
  if (run.safetyState !== LONG_SESSION_SAFETY_STATE.normal) throw new Error("Une séance interrompue par safety reste en pause.");
  if (run.activityState === LONG_SESSION_ACTIVITY_STATE.paused) return run;
  const at = timestamp(now);
  assertChronology(run, at);
  return nextRevision(run, {
    activityState: LONG_SESSION_ACTIVITY_STATE.paused,
    timing: pauseTiming(run, at),
  }, at);
}

export function resumeLongSessionRun(runInput, { now = new Date() } = {}) {
  const run = validateLongSessionRun(runInput);
  assertDraft(run);
  if (run.safetyState !== LONG_SESSION_SAFETY_STATE.normal) {
    throw new Error("L’interruption safety doit être levée avant la reprise.");
  }
  if (run.activityState === LONG_SESSION_ACTIVITY_STATE.active) return run;
  const at = timestamp(now);
  assertChronology(run, at);
  return nextRevision(run, {
    activityState: LONG_SESSION_ACTIVITY_STATE.active,
    timing: {
      ...clone(run.timing),
      activeSince: at,
      pausedAt: null,
      lastActivityAt: at,
    },
  }, at);
}

export function clearLongSessionSafetyInterruption(runInput, { now = new Date() } = {}) {
  const run = validateLongSessionRun(runInput);
  assertDraft(run);
  if (run.safetyState === LONG_SESSION_SAFETY_STATE.normal) return run;
  const at = timestamp(now);
  assertChronology(run, at);
  return nextRevision(run, {
    safetyState: LONG_SESSION_SAFETY_STATE.normal,
    timing: { ...clone(run.timing), lastActivityAt: at },
  }, at);
}

export function getLongSessionActiveElapsedMs(runInput, { now = new Date() } = {}) {
  const run = validateLongSessionRun(runInput);
  if (run.activityState === LONG_SESSION_ACTIVITY_STATE.paused) return run.timing.activeElapsedMs;
  const at = timestamp(now);
  return accrueActiveTime(run, at);
}

export function previewLongSessionCompletion(runInput, { definition } = {}) {
  const run = validateLongSessionRun(runInput);
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  assertDraft(run);
  const lines = [];
  const sourceTurnIds = [];
  for (const section of validatedDefinition.summaryContract.sections) {
    const anchor = confirmedAnchor(run, section.anchorKey);
    const value = typeof anchor?.value === "string" ? anchor.value.trim() : "";
    if (!value && section.omitWhenEmpty) continue;
    if (!value) continue;
    lines.push(`${section.label} : ${value}`);
    for (const turnId of anchor.sourceTurnIds) {
      if (!sourceTurnIds.includes(turnId)) sourceTurnIds.push(turnId);
    }
  }
  if (lines.length === 0) throw new Error("Une synthèse exige au moins un anchor confirmé.");
  const actionAnchor = confirmedAnchor(run, validatedDefinition.actionContract.anchorKey);
  const actionPlan = nonEmptyString(actionAnchor?.value) ? actionAnchor.value.trim() : null;
  return immutable({
    summary: lines.join("\n"),
    actionPlan,
    sourceTurnIds,
    generatedBy: "deterministic",
  });
}

export function completeLongSessionRun(runInput, {
  definition,
  completionMode = LONG_SESSION_COMPLETION_MODE.normal,
  summary,
  actionPlan,
  userConfirmed = false,
  now = new Date(),
  sensitiveDetector,
} = {}) {
  const run = validateLongSessionRun(runInput);
  if (run.status === LONG_SESSION_STATUS.completed) {
    return immutable({ outcome: "already_completed", idempotent: true, blocked: false, run, result: run.result });
  }
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  assertDefinitionMatches(run, validatedDefinition);
  assertDraft(run);
  if (run.safetyState !== LONG_SESSION_SAFETY_STATE.normal) throw new Error("Une séance interrompue par safety ne peut pas être clôturée.");
  if (!Object.values(LONG_SESSION_COMPLETION_MODE).includes(completionMode)) {
    throw new Error(`Mode de clôture invalide: ${completionMode}.`);
  }
  if (completionMode === LONG_SESSION_COMPLETION_MODE.early && !validatedDefinition.transitionPolicy.allowEarlyCompletion) {
    throw new Error("La clôture anticipée n’est pas autorisée par cette définition.");
  }
  const phaseState = getStructuredLongSessionState(run, { definition: validatedDefinition });
  if (completionMode === LONG_SESSION_COMPLETION_MODE.normal && !phaseState.canCompleteNormally) {
    throw new Error("Une clôture normale exige d’avoir atteint la phase de clôture.");
  }
  if (userConfirmed !== true) throw new Error("La synthèse doit être explicitement confirmée par l’utilisateur.");

  const preview = previewLongSessionCompletion(run, { definition: validatedDefinition });
  const summaryGate = gateProtocolText(summary ?? preview.summary, {
    required: true,
    maxLength: SUMMARY_MAX_LENGTH,
    ...(sensitiveDetector ? { sensitiveDetector } : {}),
  });
  const actionGate = gateProtocolText(actionPlan ?? preview.actionPlan ?? "", {
    required: false,
    maxLength: ACTION_MAX_LENGTH,
    ...(sensitiveDetector ? { sensitiveDetector } : {}),
  });
  const blockedGate = summaryGate.blocked ? summaryGate : actionGate.blocked ? actionGate : null;
  if (blockedGate) {
    const at = timestamp(now);
    return immutable({ ...blockedGate, run: interruptWithoutContentMutation(run, at) });
  }
  if (!summaryGate.ok) return summaryGate;
  if (!actionGate.ok) return actionGate;

  const at = timestamp(now);
  assertChronology(run, at);
  const currentIndex = validatedDefinition.phases.findIndex(({ id }) => id === run.currentPhaseId);
  const phaseProgress = run.phaseProgress.map((progress, index) => index === currentIndex
    ? { ...clone(progress), status: LONG_SESSION_PHASE_STATUS.completed, completedAt: at }
    : clone(progress));
  const result = {
    completionMode,
    summary: summaryGate.value,
    actionPlan: actionGate.value || null,
    sourceTurnIds: preview.sourceTurnIds,
    userConfirmed: true,
    confirmedAt: at,
  };
  const completedRun = nextRevision(run, {
    status: LONG_SESSION_STATUS.completed,
    activityState: LONG_SESSION_ACTIVITY_STATE.paused,
    safetyState: LONG_SESSION_SAFETY_STATE.normal,
    phaseProgress,
    timing: pauseTiming(run, at),
    result,
    completedAt: at,
  }, at);
  return immutable({
    outcome: "completed",
    idempotent: false,
    blocked: false,
    run: completedRun,
    result: completedRun.result,
  });
}

export function abandonLongSessionRun(runInput) {
  const run = validateLongSessionRun(runInput);
  assertDraft(run);
  return immutable({ outcome: "abandoned", runId: run.id, run: null });
}

export function getStructuredLongSessionPhases(definition) {
  return immutable(structuredPhases(validateStructuredLongSessionDefinition(definition)));
}

export function getStructuredLongSessionPrompt(definition, anchorKey) {
  const validatedDefinition = validateStructuredLongSessionDefinition(definition);
  return allPrompts(validatedDefinition).find((prompt) => prompt.anchorKey === anchorKey) || null;
}
