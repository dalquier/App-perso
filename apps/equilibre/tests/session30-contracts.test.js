import { describe, expect, it } from "vitest";
import { protocolDefinitionDigest } from "../src/protocols/digest.js";
import {
  DEFAULT_LONG_SESSION_DURATION,
  LONG_SESSION_DEFINITION_SCHEMA_VERSION,
  LONG_SESSION_INTERACTION_MODES,
  LONG_SESSION_KIND,
  LONG_SESSION_PHASES,
  validateLongSessionDefinition,
} from "../src/protocols/longSessionDefinition.js";
import {
  LONG_SESSION_RUN_SCHEMA_VERSION,
  isLongSessionStateTransitionAllowed,
  validateLongSessionRecord,
  validateLongSessionRun,
} from "../src/domain/longSession.js";

const START = "2026-08-09T14:00:00.000Z";
const LATER = "2026-08-09T14:10:00.000Z";
const DIGEST = "a".repeat(64);

function definitionFixture() {
  const labels = ["Cadrage", "Objectif", "Exploration", "Travail", "Perspective", "Action éventuelle", "Clôture"];
  const targets = [[2, 3], [3, 4], [6, 8], [8, 10], [3, 4], [2, 4], [2, 3]];
  return {
    schemaVersion: LONG_SESSION_DEFINITION_SCHEMA_VERSION,
    id: "equilibre.long-session.contract-fixture",
    version: "1.0.0",
    kind: LONG_SESSION_KIND,
    title: "Séance longue fictive de contrat",
    objective: "Valider exclusivement les contrats techniques sans contenu personnel.",
    estimatedDuration: structuredClone(DEFAULT_LONG_SESSION_DURATION),
    supportedInteractionModes: [LONG_SESSION_INTERACTION_MODES.structured],
    useWhen: ["Fixture technique à faible risque"],
    doNotUseWhen: ["Situation sensible ou urgente"],
    phases: LONG_SESSION_PHASES.map((phase, index) => ({
      ...phase,
      label: labels[index],
      objective: `Objectif technique fictif ${index + 1}`,
      targetMinutes: { min: targets[index][0], max: targets[index][1] },
    })),
    transitionPolicy: {
      mode: "user-confirmed",
      allowBack: true,
      allowPause: true,
      allowEarlyCompletion: true,
      ambiguousTransition: "offer-choices",
    },
    timingPolicy: {
      clock: "active-foreground",
      backgroundBehavior: "pause",
      autoExpire: false,
      showExactCountdown: false,
    },
    summaryContract: {
      required: true,
      userEditable: true,
      userConfirmationRequired: true,
      preserveSourceTurnIds: true,
    },
    actionContract: { required: false, nullable: true, userConfirmed: true },
    memoryContract: {
      automaticPersistence: false,
      explicitProposalRequired: true,
      correctionBeforeConfirmation: true,
    },
    safetyProfile: {
      blockedBehavior: "interrupt-without-content-mutation",
      inputGateBeforePersistence: true,
      inputGateBeforeProvider: true,
      mutationGate: true,
      bypassAllowed: false,
    },
    limits: ["Aucun diagnostic", "Aucun effet métier produit par un provider"],
  };
}

function phaseProgressFixture() {
  return LONG_SESSION_PHASES.map((phase, index) => ({
    phaseId: phase.id,
    status: index === 0 ? "active" : "pending",
    startedAt: index === 0 ? START : null,
    completedAt: null,
  }));
}

function draftRunFixture() {
  return {
    schemaVersion: LONG_SESSION_RUN_SCHEMA_VERSION,
    definitionSchemaVersion: LONG_SESSION_DEFINITION_SCHEMA_VERSION,
    id: "long-run-fixture-1",
    protocolId: "equilibre.long-session.contract-fixture",
    protocolVersion: "1.0.0",
    definitionDigest: DIGEST,
    runKind: LONG_SESSION_KIND,
    interactionMode: LONG_SESSION_INTERACTION_MODES.structured,
    status: "draft",
    activityState: "active",
    safetyState: "normal",
    currentPhaseId: LONG_SESSION_PHASES[0].id,
    phaseProgress: phaseProgressFixture(),
    turns: [],
    anchors: {},
    timing: {
      activeElapsedMs: 0,
      activeSince: START,
      pausedAt: null,
      lastActivityAt: START,
    },
    startedAt: START,
    updatedAt: START,
    revision: 0,
  };
}

describe("SESSION-30-A — LongSessionDefinition", () => {
  it("fige un contrat déclaratif versionné avec exactement sept phases", async () => {
    const validated = validateLongSessionDefinition(definitionFixture());
    expect(validated.kind).toBe("long-conversational");
    expect(validated.phases.map(({ id }) => id)).toEqual(LONG_SESSION_PHASES.map(({ id }) => id));
    expect(validated.estimatedDuration).toEqual({
      targetActiveMinutes: 30,
      normalRangeMinutes: { min: 24, max: 36 },
      softMaximumMinutes: 40,
    });
    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(validated.phases[0])).toBe(true);
    expect(await protocolDefinitionDigest(validated)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("préserve le mode structuré comme prérequis", () => {
    const invalid = definitionFixture();
    invalid.supportedInteractionModes = [LONG_SESSION_INTERACTION_MODES.semiStructured];
    expect(() => validateLongSessionDefinition(invalid)).toThrow(/structured est obligatoire/);
  });

  it("fige la durée canonique sans permettre une autre catégorie silencieuse", () => {
    const invalid = definitionFixture();
    invalid.estimatedDuration.targetActiveMinutes = 25;
    expect(() => validateLongSessionDefinition(invalid)).toThrow(/cible canonique/);
  });

  it("refuse toute fonction ou donnée utilisateur dans une définition publique", () => {
    const withFunction = definitionFixture();
    withFunction.transitionPolicy.callback = () => true;
    expect(() => validateLongSessionDefinition(withFunction)).toThrow(/fonction interdite/);

    const withMessages = definitionFixture();
    withMessages.safetyProfile.messages = ["fixture"];
    expect(() => validateLongSessionDefinition(withMessages)).toThrow(/donnée utilisateur interdite/);
  });

  it("verrouille la sécurité avant persistance, provider et mutation", () => {
    for (const field of ["inputGateBeforePersistence", "inputGateBeforeProvider", "mutationGate"]) {
      const invalid = definitionFixture();
      invalid.safetyProfile[field] = false;
      expect(() => validateLongSessionDefinition(invalid), field).toThrow(/doit valoir true/);
    }
    const bypass = definitionFixture();
    bypass.safetyProfile.bypassAllowed = true;
    expect(() => validateLongSessionDefinition(bypass)).toThrow(/doit valoir false/);
  });

  it("interdit mémoire automatique et action obligatoire", () => {
    const automaticMemory = definitionFixture();
    automaticMemory.memoryContract.automaticPersistence = true;
    expect(() => validateLongSessionDefinition(automaticMemory)).toThrow(/doit valoir false/);

    const requiredAction = definitionFixture();
    requiredAction.actionContract.required = true;
    expect(() => validateLongSessionDefinition(requiredAction)).toThrow(/doit valoir false/);
  });
});

describe("SESSION-30-A — LongSessionRun", () => {
  it("valide un draft actif sans modifier le moteur BUILD-04", () => {
    const validated = validateLongSessionRun(draftRunFixture());
    expect(validated).toMatchObject({
      runKind: "long-conversational",
      status: "draft",
      activityState: "active",
      currentPhaseId: "framing",
    });
    expect(Object.isFrozen(validated)).toBe(true);
  });

  it("arrête l’horloge pendant une pause", () => {
    const paused = draftRunFixture();
    paused.activityState = "paused";
    paused.timing = {
      activeElapsedMs: 600_000,
      activeSince: null,
      pausedAt: LATER,
      lastActivityAt: LATER,
    };
    expect(validateLongSessionRun(paused).timing.activeElapsedMs).toBe(600_000);

    paused.timing.activeSince = START;
    expect(() => validateLongSessionRun(paused)).toThrow(/ne doit pas conserver activeSince/);
  });

  it("rend l’interruption safety incompatible avec une activité en cours", () => {
    const interrupted = draftRunFixture();
    interrupted.safetyState = "interrupted";
    expect(() => validateLongSessionRun(interrupted)).toThrow(/suspend nécessairement/);
  });

  it("sépare les turns originaux des anchors confirmés", () => {
    const run = draftRunFixture();
    run.turns.push({
      id: "turn-fixture-1",
      phaseId: "framing",
      role: "user",
      content: "Contenu strictement fictif.",
      createdAt: START,
      status: "complete",
      modality: "text",
    });
    run.anchors.sessionGoal = {
      status: "confirmed",
      value: "Objectif fictif confirmé.",
      sourceTurnIds: ["turn-fixture-1"],
      updatedAt: LATER,
      confirmedAt: LATER,
    };
    const validated = validateLongSessionRun(run);
    expect(validated.turns[0].content).toBe("Contenu strictement fictif.");
    expect(validated.anchors.sessionGoal.value).toBe("Objectif fictif confirmé.");
    expect(validated.anchors.sessionGoal.sourceTurnIds).toEqual(["turn-fixture-1"]);
  });

  it("formalise uniquement les transitions de haut niveau autorisées", () => {
    expect(isLongSessionStateTransitionAllowed(
      { status: "draft", activityState: "active", safetyState: "normal" },
      { status: "draft", activityState: "paused", safetyState: "normal" },
    )).toBe(true);
    expect(isLongSessionStateTransitionAllowed(
      { status: "draft", activityState: "active", safetyState: "normal" },
      { status: "completed", activityState: "paused", safetyState: "normal" },
    )).toBe(true);
    expect(isLongSessionStateTransitionAllowed(
      { status: "completed", activityState: "paused", safetyState: "normal" },
      { status: "draft", activityState: "active", safetyState: "normal" },
    )).toBe(false);
  });

  it("accepte une clôture anticipée sans action mais avec synthèse confirmée", () => {
    const completed = draftRunFixture();
    completed.status = "completed";
    completed.activityState = "paused";
    completed.phaseProgress = completed.phaseProgress.map((phase) => ({
      ...phase,
      status: "completed",
      startedAt: START,
      completedAt: LATER,
    }));
    completed.timing = {
      activeElapsedMs: 1_200_000,
      activeSince: null,
      pausedAt: LATER,
      lastActivityAt: LATER,
    };
    completed.completedAt = LATER;
    completed.result = {
      completionMode: "early",
      summary: "Synthèse fictive confirmée.",
      actionPlan: null,
      sourceTurnIds: [],
      userConfirmed: true,
      confirmedAt: LATER,
    };
    const validated = validateLongSessionRun(completed);
    expect(validated.result).toMatchObject({ completionMode: "early", actionPlan: null });
  });
});

describe("SESSION-30-A — futur SessionRecord long", () => {
  it("fige la provenance, le digest et l’action nullable sans créer de record", () => {
    const record = validateLongSessionRecord({
      id: "record-fixture-1",
      recordType: "long-session",
      sourceSessionId: "long-run-fixture-1",
      protocolRef: {
        id: "equilibre.long-session.contract-fixture",
        version: "1.0.0",
        definitionDigest: DIGEST,
      },
      createdAt: START,
      completedAt: LATER,
      completionMode: "early",
      summary: "Synthèse fictive confirmée.",
      actionPlan: null,
      sourceTurnIds: [],
    });
    expect(record.actionPlan).toBeNull();
    expect(record.protocolRef.definitionDigest).toBe(DIGEST);
    expect(Object.isFrozen(record)).toBe(true);
  });
});
