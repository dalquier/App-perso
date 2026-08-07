import { protocolDefinitionDigest } from "./digest.js";
import { protocolRegistry } from "./catalog.js";
import { gateProtocolText } from "../safety/textGate.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "../safety/sensitiveGuard.js";

const COMPLETED = "completed";
const DRAFT = "draft";

const nowIso = (now = new Date()) => new Date(now).toISOString();
const randomId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

function immutable(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) immutable(child);
  return Object.freeze(value);
}

function clone(value) {
  return structuredClone(value);
}

function protocolRuns(state) {
  return Array.isArray(state?.protocolRuns) ? state.protocolRuns : [];
}

function sessionRecords(state) {
  return Array.isArray(state?.sessionRecords) ? state.sessionRecords : [];
}

function findRun(state, runId) {
  const run = protocolRuns(state).find((item) => item.id === runId);
  if (!run) throw new Error(`ProtocolRun introuvable: ${runId}.`);
  return run;
}

function definitionFor(run, registry) {
  const definition = registry.get(run.protocolId, run.protocolVersion);
  if (!definition) throw new Error(`Définition introuvable: ${run.protocolId}@${run.protocolVersion}.`);
  return definition;
}

function replaceRun(state, updatedRun) {
  return {
    ...state,
    protocolRuns: protocolRuns(state).map((item) => item.id === updatedRun.id ? updatedRun : item),
  };
}

function answeredAllSteps(run, definition) {
  return definition.steps.every((step) => Object.prototype.hasOwnProperty.call(run.answers || {}, step.id));
}

function assertDraft(run) {
  if (run.status === COMPLETED) throw new Error("Un protocole terminé est immuable.");
  if (run.status !== DRAFT) throw new Error(`Statut ProtocolRun invalide: ${run.status}.`);
}

function buildSummary(definition, answers) {
  const sourceStepIds = [];
  const lines = [];
  for (const line of definition.summaryRule.lines) {
    const value = answers[line.stepId]?.value ?? "";
    if (!value && line.omitWhenEmpty) continue;
    sourceStepIds.push(line.stepId);
    lines.push(`${line.label} : ${value}`);
  }
  return {
    summary: lines.join(definition.summaryRule.separator),
    sourceStepIds,
  };
}

function actionMetadata(definition, answers) {
  if (definition.id !== "equilibre.protocol.take-small-step") return {};
  return {
    actionContext: answers.focus?.value || null,
    successBoundary: answers.minimum_result?.value || null,
    firstMove: answers.first_move?.value || null,
    startCue: answers.start_cue?.value || null,
    fallbackAction: answers.fallback_step?.value || null,
  };
}

function completionSafetyAggregate(definition, answers) {
  return definition.steps
    .map((step) => answers[step.id]?.value ?? "")
    .filter(Boolean)
    .join(" ");
}

export async function createProtocolRun(state, {
  protocolId,
  protocolVersion,
  registry = protocolRegistry,
  now = new Date(),
  idFactory = () => randomId("protocol-run"),
} = {}) {
  if (protocolRuns(state).some((run) => run.status === DRAFT)) {
    throw new Error("Une activité guidée est déjà en cours.");
  }
  if (state?.lastSession && state.lastSession.completed === false) {
    throw new Error("Une séance guidée BUILD-01 inachevée doit être reprise ou abandonnée avant de démarrer un protocole.");
  }

  const definition = registry.get(protocolId, protocolVersion);
  if (!definition) throw new Error(`Définition introuvable: ${protocolId}@${protocolVersion}.`);
  const startedAt = nowIso(now);
  const run = immutable({
    id: idFactory(),
    protocolId: definition.id,
    protocolVersion: definition.version,
    definitionDigest: await protocolDefinitionDigest(definition),
    status: DRAFT,
    startedAt,
    updatedAt: startedAt,
    currentStepId: definition.steps[0].id,
    answers: {},
    revision: 0,
  });
  return {
    ...state,
    protocolRuns: [...protocolRuns(state), run],
  };
}

export function answerProtocolStep(state, {
  runId,
  stepId,
  value,
  registry = protocolRegistry,
  now = new Date(),
  sensitiveDetector,
} = {}) {
  const run = findRun(state, runId);
  assertDraft(run);
  const definition = definitionFor(run, registry);
  const targetIndex = definition.steps.findIndex((step) => step.id === stepId);
  if (targetIndex < 0) throw new Error(`Étape inconnue: ${stepId}.`);
  const currentIndex = definition.steps.findIndex((step) => step.id === run.currentStepId);
  if (currentIndex < 0) throw new Error(`Étape courante invalide: ${run.currentStepId}.`);

  // Parcours strictement linéaire : on peut répondre à l'étape courante ou
  // rééditer une étape déjà atteinte, jamais appeler directement une étape future.
  const wasAlreadyAnswered = Object.prototype.hasOwnProperty.call(run.answers || {}, stepId);
  if (targetIndex > currentIndex && !wasAlreadyAnswered) {
    throw new Error(`Saut d’étape interdit: ${stepId}.`);
  }

  const step = definition.steps[targetIndex];
  const gate = gateProtocolText(value, {
    required: step.required,
    maxLength: step.maxLength,
    ...(sensitiveDetector ? { sensitiveDetector } : {}),
  });
  if (!gate.ok) return gate;

  const nextCurrentStepId = targetIndex === currentIndex && currentIndex < definition.steps.length - 1
    ? definition.steps[currentIndex + 1].id
    : run.currentStepId;
  const updatedRun = immutable({
    ...clone(run),
    currentStepId: nextCurrentStepId,
    answers: {
      ...clone(run.answers || {}),
      [stepId]: {
        value: gate.value,
        answeredAt: nowIso(now),
      },
    },
    updatedAt: nowIso(now),
    revision: (run.revision || 0) + 1,
  });
  return immutable({
    ok: true,
    blocked: false,
    status: "accepted",
    state: replaceRun(state, updatedRun),
    run: updatedRun,
  });
}

export function moveProtocolBack(state, {
  runId,
  registry = protocolRegistry,
  now = new Date(),
} = {}) {
  const run = findRun(state, runId);
  assertDraft(run);
  const definition = definitionFor(run, registry);
  const currentIndex = definition.steps.findIndex((step) => step.id === run.currentStepId);
  if (currentIndex <= 0) return state;
  const updatedRun = immutable({
    ...clone(run),
    currentStepId: definition.steps[currentIndex - 1].id,
    updatedAt: nowIso(now),
    revision: (run.revision || 0) + 1,
  });
  return replaceRun(state, updatedRun);
}

export function previewProtocolRun(state, {
  runId,
  registry = protocolRegistry,
  now = new Date(),
} = {}) {
  const run = findRun(state, runId);
  assertDraft(run);
  const definition = definitionFor(run, registry);
  if (!answeredAllSteps(run, definition)) throw new Error("Toutes les étapes doivent avoir été atteintes avant l’aperçu.");
  for (const step of definition.steps) {
    if (step.required && !(run.answers[step.id]?.value || "")) throw new Error(`Réponse obligatoire manquante: ${step.id}.`);
  }
  const { summary, sourceStepIds } = buildSummary(definition, run.answers);
  const actionValue = run.answers[definition.actionStepId]?.value || "";
  return immutable({
    summary,
    actionText: actionValue || null,
    generatedBy: "deterministic",
    sourceStepIds,
    createdAt: nowIso(now),
    ...actionMetadata(definition, run.answers),
  });
}

export function completeProtocolRun(state, {
  runId,
  registry = protocolRegistry,
  now = new Date(),
  recordIdFactory = () => randomId("session-record"),
} = {}) {
  const run = findRun(state, runId);
  const definition = definitionFor(run, registry);

  if (run.status === COMPLETED) {
    const record = sessionRecords(state).find((item) => item.id === run.sessionRecordId)
      || sessionRecords(state).find((item) => item.sourceSessionId === run.id)
      || null;
    return immutable({
      outcome: "already_completed",
      blocked: false,
      idempotent: true,
      state,
      run,
      result: run.result,
      sessionRecord: record,
    });
  }

  assertDraft(run);
  if (!answeredAllSteps(run, definition)) throw new Error("Toutes les étapes doivent avoir été atteintes avant Terminer.");
  for (const step of definition.steps) {
    if (step.required && !(run.answers[step.id]?.value || "")) throw new Error(`Réponse obligatoire manquante: ${step.id}.`);
  }

  const aggregate = completionSafetyAggregate(definition, run.answers);
  if (aggregate && detectSensitiveContent(aggregate)) {
    // Aucun état/run/résultat n'est copié dans la réponse de contrôle :
    // l'appelant conserve l'état d'entrée inchangé et affiche l'interruption transitoire.
    return Object.freeze({
      outcome: "blocked",
      blocked: true,
      idempotent: false,
      safetyMessage: SAFETY_MESSAGE,
    });
  }

  const completedAt = nowIso(now);
  const { summary, sourceStepIds } = buildSummary(definition, run.answers);
  const actionValue = run.answers[definition.actionStepId]?.value || "";
  const result = immutable({
    summary,
    actionText: actionValue || null,
    generatedBy: "deterministic",
    sourceStepIds,
    createdAt: completedAt,
    ...actionMetadata(definition, run.answers),
  });
  const sessionRecord = immutable({
    id: recordIdFactory(),
    recordType: "protocol",
    sourceSessionId: run.id,
    protocolRef: { id: run.protocolId, version: run.protocolVersion },
    createdAt: run.startedAt,
    completedAt,
    answers: Object.fromEntries(definition.steps.map((step) => [step.id, run.answers[step.id]?.value ?? ""])),
    summary: result.summary,
    actionPlan: result.actionText || "",
  });
  const completedRun = immutable({
    ...clone(run),
    status: COMPLETED,
    completedAt,
    updatedAt: completedAt,
    result,
    sessionRecordId: sessionRecord.id,
    revision: (run.revision || 0) + 1,
  });
  const nextState = {
    ...replaceRun(state, completedRun),
    sessionRecords: [...sessionRecords(state), sessionRecord],
  };

  return immutable({
    outcome: "completed",
    blocked: false,
    idempotent: false,
    state: nextState,
    run: completedRun,
    result,
    sessionRecord,
  });
}

export function abandonProtocolRun(state, { runId } = {}) {
  const run = findRun(state, runId);
  assertDraft(run);
  return {
    ...state,
    protocolRuns: protocolRuns(state).filter((item) => item.id !== runId),
  };
}
