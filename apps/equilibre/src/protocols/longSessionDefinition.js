const FORBIDDEN_DEFINITION_KEYS = new Set([
  "answers",
  "conversation",
  "conversations",
  "memoryEntries",
  "messages",
  "personalData",
  "protocolRuns",
  "sessionRecords",
  "turns",
  "user",
  "userData",
  "userId",
]);

export const LONG_SESSION_DEFINITION_SCHEMA_VERSION = 1;
export const LONG_SESSION_KIND = "long-conversational";

export const LONG_SESSION_INTERACTION_MODES = Object.freeze({
  structured: "structured",
  semiStructured: "semi-structured",
});

export const LONG_SESSION_PHASES = Object.freeze([
  Object.freeze({ id: "framing", order: 1 }),
  Object.freeze({ id: "session-goal", order: 2 }),
  Object.freeze({ id: "exploration", order: 3 }),
  Object.freeze({ id: "core-work", order: 4 }),
  Object.freeze({ id: "perspective", order: 5 }),
  Object.freeze({ id: "optional-action", order: 6 }),
  Object.freeze({ id: "closure", order: 7 }),
]);

export const DEFAULT_LONG_SESSION_DURATION = Object.freeze({
  targetActiveMinutes: 30,
  normalRangeMinutes: Object.freeze({ min: 24, max: 36 }),
  softMaximumMinutes: 40,
});

const REQUIRED_FIELDS = Object.freeze([
  "schemaVersion",
  "id",
  "version",
  "kind",
  "title",
  "objective",
  "estimatedDuration",
  "supportedInteractionModes",
  "useWhen",
  "doNotUseWhen",
  "phases",
  "transitionPolicy",
  "timingPolicy",
  "summaryContract",
  "actionContract",
  "memoryContract",
  "safetyProfile",
  "limits",
]);

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function deepFreezeContract(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreezeContract(child);
  return Object.freeze(value);
}

function clone(value) {
  return structuredClone(value);
}

function assertDeclarativeDefinition(value, path = "definition") {
  if (typeof value === "function") throw new TypeError(`${path}: fonction interdite.`);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertDeclarativeDefinition(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_DEFINITION_KEYS.has(key)) {
      throw new TypeError(`${path}.${key}: donnée utilisateur interdite dans une définition.`);
    }
    assertDeclarativeDefinition(child, `${path}.${key}`);
  }
}

function assertStringList(value, field, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || !value.every(nonEmptyString)) {
    throw new TypeError(`${field} doit être une liste de chaînes non vides.`);
  }
}

function assertBoolean(object, field, expected) {
  if (typeof object[field] !== "boolean") throw new TypeError(`${field} doit être booléen.`);
  if (expected !== undefined && object[field] !== expected) {
    throw new TypeError(`${field} doit valoir ${expected}.`);
  }
}

function validateDuration(duration) {
  if (!isObject(duration)) throw new TypeError("estimatedDuration doit être un objet.");
  const { targetActiveMinutes, normalRangeMinutes, softMaximumMinutes } = duration;
  if (!Number.isInteger(targetActiveMinutes) || targetActiveMinutes <= 0) {
    throw new TypeError("targetActiveMinutes doit être un entier positif.");
  }
  if (!isObject(normalRangeMinutes)
    || !Number.isInteger(normalRangeMinutes.min)
    || !Number.isInteger(normalRangeMinutes.max)
    || normalRangeMinutes.min <= 0
    || normalRangeMinutes.min > targetActiveMinutes
    || normalRangeMinutes.max < targetActiveMinutes) {
    throw new TypeError("normalRangeMinutes doit encadrer la durée cible.");
  }
  if (!Number.isInteger(softMaximumMinutes) || softMaximumMinutes < normalRangeMinutes.max) {
    throw new TypeError("softMaximumMinutes doit être supérieur ou égal à la plage normale.");
  }
  if (targetActiveMinutes !== DEFAULT_LONG_SESSION_DURATION.targetActiveMinutes
    || normalRangeMinutes.min !== DEFAULT_LONG_SESSION_DURATION.normalRangeMinutes.min
    || normalRangeMinutes.max !== DEFAULT_LONG_SESSION_DURATION.normalRangeMinutes.max
    || softMaximumMinutes !== DEFAULT_LONG_SESSION_DURATION.softMaximumMinutes) {
    throw new TypeError("estimatedDuration doit respecter la cible canonique 30 / 24–36 / 40 minutes.");
  }
}

function validatePhases(phases) {
  if (!Array.isArray(phases) || phases.length !== LONG_SESSION_PHASES.length) {
    throw new TypeError("phases doit contenir exactement les sept phases canoniques.");
  }
  phases.forEach((phase, index) => {
    if (!isObject(phase)) throw new TypeError(`phases[${index}] doit être un objet.`);
    const canonical = LONG_SESSION_PHASES[index];
    if (phase.id !== canonical.id || phase.order !== canonical.order) {
      throw new TypeError(`Phase canonique attendue à l’ordre ${canonical.order}: ${canonical.id}.`);
    }
    if (!nonEmptyString(phase.label) || !nonEmptyString(phase.objective)) {
      throw new TypeError(`Label et objectif requis pour la phase ${canonical.id}.`);
    }
    if (!isObject(phase.targetMinutes)
      || !Number.isInteger(phase.targetMinutes.min)
      || !Number.isInteger(phase.targetMinutes.max)
      || phase.targetMinutes.min < 0
      || phase.targetMinutes.max < phase.targetMinutes.min) {
      throw new TypeError(`targetMinutes invalide pour la phase ${canonical.id}.`);
    }
  });
}

function validatePolicies(definition) {
  const { transitionPolicy, timingPolicy, summaryContract, actionContract, memoryContract, safetyProfile } = definition;
  for (const [name, value] of Object.entries({ transitionPolicy, timingPolicy, summaryContract, actionContract, memoryContract, safetyProfile })) {
    if (!isObject(value)) throw new TypeError(`${name} doit être un objet déclaratif.`);
  }

  if (transitionPolicy.mode !== "user-confirmed") {
    throw new TypeError("transitionPolicy.mode doit valoir user-confirmed.");
  }
  assertBoolean(transitionPolicy, "allowBack", true);
  assertBoolean(transitionPolicy, "allowPause", true);
  assertBoolean(transitionPolicy, "allowEarlyCompletion", true);
  if (transitionPolicy.ambiguousTransition !== "offer-choices") {
    throw new TypeError("Une transition ambiguë doit proposer des choix.");
  }

  if (timingPolicy.clock !== "active-foreground" || timingPolicy.backgroundBehavior !== "pause") {
    throw new TypeError("La politique temporelle doit mesurer uniquement le temps actif au premier plan.");
  }
  assertBoolean(timingPolicy, "autoExpire", false);
  assertBoolean(timingPolicy, "showExactCountdown", false);

  assertBoolean(summaryContract, "required", true);
  assertBoolean(summaryContract, "userEditable", true);
  assertBoolean(summaryContract, "userConfirmationRequired", true);
  assertBoolean(summaryContract, "preserveSourceTurnIds", true);

  assertBoolean(actionContract, "required", false);
  assertBoolean(actionContract, "nullable", true);
  assertBoolean(actionContract, "userConfirmed", true);

  assertBoolean(memoryContract, "automaticPersistence", false);
  assertBoolean(memoryContract, "explicitProposalRequired", true);
  assertBoolean(memoryContract, "correctionBeforeConfirmation", true);

  if (safetyProfile.blockedBehavior !== "interrupt-without-content-mutation") {
    throw new TypeError("Le comportement safety doit interrompre sans mutation du contenu bloqué.");
  }
  assertBoolean(safetyProfile, "inputGateBeforePersistence", true);
  assertBoolean(safetyProfile, "inputGateBeforeProvider", true);
  assertBoolean(safetyProfile, "mutationGate", true);
  assertBoolean(safetyProfile, "bypassAllowed", false);
}

export function validateLongSessionDefinition(input) {
  if (!isObject(input)) throw new TypeError("Définition de séance longue invalide.");
  assertDeclarativeDefinition(input);
  for (const field of REQUIRED_FIELDS) {
    if (!(field in input)) throw new TypeError(`Champ public requis manquant: ${field}.`);
  }

  if (input.schemaVersion !== LONG_SESSION_DEFINITION_SCHEMA_VERSION) {
    throw new TypeError(`schemaVersion doit valoir ${LONG_SESSION_DEFINITION_SCHEMA_VERSION}.`);
  }
  if (!nonEmptyString(input.id) || !input.id.startsWith("equilibre.long-session.")) {
    throw new TypeError("id doit utiliser l’espace de noms equilibre.long-session.");
  }
  if (!/^\d+\.\d+\.\d+$/.test(input.version)) throw new TypeError("version doit être sémantique x.y.z.");
  if (input.kind !== LONG_SESSION_KIND) throw new TypeError(`kind doit valoir ${LONG_SESSION_KIND}.`);
  if (!nonEmptyString(input.title) || !nonEmptyString(input.objective)) {
    throw new TypeError("title et objective doivent être des chaînes non vides.");
  }

  validateDuration(input.estimatedDuration);
  const modes = input.supportedInteractionModes;
  if (!Array.isArray(modes) || modes.length === 0 || new Set(modes).size !== modes.length) {
    throw new TypeError("supportedInteractionModes doit être une liste unique non vide.");
  }
  const allowedModes = new Set(Object.values(LONG_SESSION_INTERACTION_MODES));
  if (!modes.every((mode) => allowedModes.has(mode)) || !modes.includes(LONG_SESSION_INTERACTION_MODES.structured)) {
    throw new TypeError("Le mode structured est obligatoire et les modes inconnus sont interdits.");
  }

  assertStringList(input.useWhen, "useWhen");
  assertStringList(input.doNotUseWhen, "doNotUseWhen");
  assertStringList(input.limits, "limits");
  validatePhases(input.phases);
  validatePolicies(input);

  return deepFreezeContract(clone(input));
}

export function isLongSessionDefinition(value) {
  try {
    validateLongSessionDefinition(value);
    return true;
  } catch {
    return false;
  }
}
