import { describe, expect, it } from "vitest";
import {
  abandonLongSessionRun,
  advanceLongSessionPhase,
  clearLongSessionSafetyInterruption,
  completeLongSessionRun,
  confirmLongSessionAnchor,
  createLongSessionRun,
  getLongSessionActiveElapsedMs,
  getStructuredLongSessionPhases,
  getStructuredLongSessionPrompt,
  getStructuredLongSessionState,
  moveLongSessionBack,
  pauseLongSessionRun,
  previewLongSessionCompletion,
  resumeLongSessionRun,
  submitLongSessionAnswer,
  validateStructuredLongSessionDefinition,
} from "../src/domain/longSessionEngine.js";
import {
  LONG_SESSION_COMPLETION_MODE,
  validateLongSessionRun,
} from "../src/domain/longSession.js";
import {
  PROBLEM_SOLVING_LONG_SESSION_DEFINITION,
  STRUCTURED_LONG_SESSION_REFS,
} from "../src/protocols/problemSolvingLongSession.js";

const definition = PROBLEM_SOLVING_LONG_SESSION_DEFINITION;
const BASE_MS = Date.parse("2026-08-09T16:00:00.000Z");
const atMinute = (minute) => new Date(BASE_MS + minute * 60_000);
const idFactory = (prefix) => {
  let sequence = 0;
  return () => `${prefix}-${++sequence}`;
};

async function newRun(options = {}) {
  return createLongSessionRun({
    definition,
    now: atMinute(0),
    idFactory: () => "long-session-fixture-1",
    ...options,
  });
}

function confirmAnswer(run, anchorKey, content, minute, turnIds = () => `turn-fixture-${minute}-${anchorKey}`) {
  return submitLongSessionAnswer(run, {
    definition,
    anchorKey,
    content,
    confirm: true,
    now: atMinute(minute),
    idFactory: turnIds,
  }).run;
}

async function reachClosure({ withAction = false } = {}) {
  const turnIds = idFactory("turn-journey");
  let run = await newRun();
  run = confirmAnswer(run, "sessionTopic", "Organiser un choix fictif entre deux créneaux.", 1, turnIds);
  run = advanceLongSessionPhase(run, { definition, now: atMinute(2) });
  run = confirmAnswer(run, "sessionGoal", "Choisir comment comparer les deux créneaux fictifs.", 3, turnIds);
  run = advanceLongSessionPhase(run, { definition, now: atMinute(4) });
  run = confirmAnswer(run, "controlScope", "Je contrôle ma disponibilité, pas celle des participants fictifs.", 5, turnIds);
  run = confirmAnswer(run, "problemStatement", "Trouver un créneau compatible avec les contraintes connues.", 6, turnIds);
  run = advanceLongSessionPhase(run, { definition, now: atMinute(7) });
  run = confirmAnswer(run, "options", "Option A mardi, option B jeudi, ou différer la décision.", 8, turnIds);
  run = confirmAnswer(run, "tradeoffs", "Mardi est rapide ; jeudi laisse plus de préparation.", 9, turnIds);
  run = confirmAnswer(run, "selectedOption", "Retenir jeudi sous réserve de confirmation fictive.", 10, turnIds);
  run = advanceLongSessionPhase(run, { definition, now: atMinute(11) });
  run = confirmAnswer(run, "keyPerspective", "Le besoin principal est une confirmation de disponibilité.", 12, turnIds);
  run = advanceLongSessionPhase(run, { definition, now: atMinute(13) });
  run = confirmAnswer(run, "actionDecision", withAction ? "Prévoir une vérification." : "Ne pas prévoir d’action maintenant.", 14, turnIds);
  if (withAction) {
    run = confirmAnswer(run, "actionPlan", "Envoyer une demande fictive de disponibilité.", 15, turnIds);
  }
  run = advanceLongSessionPhase(run, { definition, now: atMinute(16) });
  return run;
}

describe("SESSION-30-B — définition S30-02", () => {
  it("publie exactement une première séance structurée locale", () => {
    expect(STRUCTURED_LONG_SESSION_REFS).toEqual([
      { id: "equilibre.long-session.solve-concrete-problem", version: "1.0.0" },
    ]);
    expect(validateStructuredLongSessionDefinition(definition)).toStrictEqual(definition);
    expect(definition.phases).toHaveLength(7);
    expect(definition.supportedInteractionModes).toEqual(["structured"]);
  });

  it("déclare une question à la fois et des sections de synthèse déterministes", () => {
    const phases = getStructuredLongSessionPhases(definition);
    expect(phases[0].prompts.map(({ anchorKey }) => anchorKey)).toEqual(["sessionTopic"]);
    expect(getStructuredLongSessionPrompt(definition, "selectedOption")?.question).toMatch(/option/i);
    expect(getStructuredLongSessionPrompt(definition, "inconnu")).toBeNull();
    expect(Object.isFrozen(phases)).toBe(true);
  });

  it("refuse silencieusement d’étendre le premier moteur au semi-structuré", () => {
    const invalid = structuredClone(definition);
    invalid.supportedInteractionModes.push("semi-structured");
    expect(() => validateStructuredLongSessionDefinition(invalid)).toThrow(/uniquement une définition structured/);
  });
});

describe("SESSION-30-B — création et réponses", () => {
  it("crée un run long actif, digesté, immuable et sans persistance", async () => {
    const run = await newRun({
      originRef: { type: "conversation", conversationId: "conversation-fixture" },
    });
    expect(run).toMatchObject({
      protocolId: definition.id,
      protocolVersion: definition.version,
      interactionMode: "structured",
      status: "draft",
      currentPhaseId: "framing",
      revision: 0,
      originRef: { conversationId: "conversation-fixture" },
    });
    expect(run.definitionDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(run.turns).toEqual([]);
    expect(run.anchors).toEqual({});
    expect(run.sessionRecordId).toBeUndefined();
    expect(Object.isFrozen(run)).toBe(true);
  });

  it("interdit la création semi-structurée dans cet incrément", async () => {
    await expect(newRun({ interactionMode: "semi-structured" })).rejects.toThrow(/pas disponible/);
  });

  it("refuse un second draft guidé sans dépendre du stockage", async () => {
    await expect(newRun({ existingGuidedRuns: [{ id: "short-draft-fixture", status: "draft" }] }))
      .rejects.toThrow(/activité guidée est déjà en cours/);
    await expect(newRun({ existingGuidedRuns: [{ id: "completed-fixture", status: "completed" }] }))
      .resolves.toMatchObject({ status: "draft" });
  });

  it("garde une réponse comme proposition jusqu’à confirmation explicite", async () => {
    const run = await newRun();
    const proposal = submitLongSessionAnswer(run, {
      definition,
      anchorKey: "sessionTopic",
      content: "  Sujet fictif à clarifier.  ",
      now: atMinute(1),
      idFactory: () => "turn-proposal",
    });
    expect(proposal.status).toBe("proposed");
    expect(proposal.anchor).toMatchObject({ status: "proposed", value: "Sujet fictif à clarifier." });
    expect(getStructuredLongSessionState(proposal.run, { definition }).canAdvance).toBe(false);

    const confirmed = confirmLongSessionAnchor(proposal.run, {
      definition,
      anchorKey: "sessionTopic",
      now: atMinute(2),
    });
    expect(confirmed.anchors.sessionTopic.status).toBe("confirmed");
    expect(getStructuredLongSessionState(confirmed, { definition }).canAdvance).toBe(true);
  });

  it("conserve le message original distinct d’un anchor corrigé", async () => {
    const turnIds = idFactory("turn-correction");
    let run = await newRun();
    run = confirmAnswer(run, "sessionTopic", "Première formulation fictive.", 1, turnIds);
    run = confirmAnswer(run, "sessionTopic", "Formulation fictive corrigée.", 2, turnIds);
    expect(run.turns.map(({ content }) => content)).toEqual([
      "Première formulation fictive.",
      "Formulation fictive corrigée.",
    ]);
    expect(run.anchors.sessionTopic.value).toBe("Formulation fictive corrigée.");
    expect(run.anchors.sessionTopic.sourceTurnIds).toEqual(["turn-correction-2"]);
  });

  it("refuse un anchor appartenant à une autre phase", async () => {
    const run = await newRun();
    expect(() => submitLongSessionAnswer(run, {
      definition,
      anchorKey: "selectedOption",
      content: "Option fictive.",
      confirm: true,
      now: atMinute(1),
    })).toThrow(/non autorisée dans la phase framing/);
  });

  it("bloque un contenu sensible avant de le copier et suspend la séance", async () => {
    const run = await newRun();
    const blockedText = "Fixture sensible : je veux mourir.";
    const result = submitLongSessionAnswer(run, {
      definition,
      anchorKey: "sessionTopic",
      content: blockedText,
      confirm: true,
      now: atMinute(2),
    });
    expect(result).toMatchObject({ ok: false, blocked: true, code: "sensitive" });
    expect(result.run).toMatchObject({ activityState: "paused", safetyState: "interrupted" });
    expect(result.run.turns).toEqual([]);
    expect(result.run.anchors).toEqual({});
    expect(JSON.stringify(result)).not.toContain(blockedText);
  });
});

describe("SESSION-30-B — phases, pause et temps actif", () => {
  it("interdit d’avancer tant que les anchors requis ne sont pas confirmés", async () => {
    const run = await newRun();
    expect(() => advanceLongSessionPhase(run, { definition, now: atMinute(1) })).toThrow(/sessionTopic/);
  });

  it("avance explicitement sans changer de phase automatiquement après une réponse", async () => {
    let run = await newRun();
    run = confirmAnswer(run, "sessionTopic", "Sujet fictif.", 1);
    expect(run.currentPhaseId).toBe("framing");
    run = advanceLongSessionPhase(run, { definition, now: atMinute(2) });
    expect(run.currentPhaseId).toBe("session-goal");
    expect(run.phaseProgress[0].status).toBe("completed");
    expect(run.phaseProgress[1].status).toBe("active");
  });

  it("compte uniquement le temps actif et exclut une pause longue", async () => {
    let run = await newRun();
    run = pauseLongSessionRun(run, { now: atMinute(10) });
    expect(run.timing.activeElapsedMs).toBe(600_000);
    expect(getLongSessionActiveElapsedMs(run, { now: atMinute(120) })).toBe(600_000);
    run = resumeLongSessionRun(run, { now: atMinute(120) });
    expect(getLongSessionActiveElapsedMs(run, { now: atMinute(125) })).toBe(900_000);
    run = pauseLongSessionRun(run, { now: atMinute(125) });
    expect(run.timing.activeElapsedMs).toBe(900_000);
  });

  it("exige une levée safety puis une reprise distincte", async () => {
    const run = await newRun();
    const blocked = submitLongSessionAnswer(run, {
      definition,
      anchorKey: "sessionTopic",
      content: "Fixture sensible : je veux mourir.",
      now: atMinute(1),
    }).run;
    expect(() => resumeLongSessionRun(blocked, { now: atMinute(2) })).toThrow(/levée avant la reprise/);
    const cleared = clearLongSessionSafetyInterruption(blocked, { now: atMinute(2) });
    expect(cleared).toMatchObject({ activityState: "paused", safetyState: "normal" });
    const resumed = resumeLongSessionRun(cleared, { now: atMinute(3) });
    expect(resumed).toMatchObject({ activityState: "active", safetyState: "normal" });
  });

  it("revient à la phase précédente sans supprimer turns ni anchors", async () => {
    let run = await newRun();
    run = confirmAnswer(run, "sessionTopic", "Sujet fictif conservé.", 1);
    run = advanceLongSessionPhase(run, { definition, now: atMinute(2) });
    run = confirmAnswer(run, "sessionGoal", "Objectif fictif conservé.", 3);
    const returned = moveLongSessionBack(run, { definition, now: atMinute(4) });
    expect(returned.currentPhaseId).toBe("framing");
    expect(returned.turns).toHaveLength(2);
    expect(returned.anchors.sessionGoal.value).toBe("Objectif fictif conservé.");
    expect(returned.phaseProgress[1]).toMatchObject({ status: "pending", startedAt: null });
  });

  it("refuse les horodatages qui remontent le temps", async () => {
    const run = await newRun();
    expect(() => pauseLongSessionRun(run, { now: new Date(BASE_MS - 1) })).toThrow(/remonter le temps/);
  });
});

describe("SESSION-30-B — synthèse et clôture", () => {
  it("produit une synthèse déterministe et permet une clôture normale sans action", async () => {
    const run = await reachClosure();
    const state = getStructuredLongSessionState(run, { definition });
    expect(state).toMatchObject({ phaseId: "closure", canCompleteNormally: true, currentPrompt: null });
    const preview = previewLongSessionCompletion(run, { definition });
    expect(preview.generatedBy).toBe("deterministic");
    expect(preview.summary).toContain("Problème précis");
    expect(preview.actionPlan).toBeNull();

    const completed = completeLongSessionRun(run, {
      definition,
      userConfirmed: true,
      now: atMinute(17),
    });
    expect(completed).toMatchObject({ outcome: "completed", blocked: false, idempotent: false });
    expect(completed.run).toMatchObject({ status: "completed", activityState: "paused" });
    expect(completed.result).toMatchObject({ completionMode: "normal", actionPlan: null, userConfirmed: true });
    expect(completed.run.sessionRecordId).toBeUndefined();
    expect(completed).not.toHaveProperty("sessionRecord");
    expect(validateLongSessionRun(completed.run)).toBeTruthy();
  });

  it("conserve une action facultative lorsqu’elle a été explicitement confirmée", async () => {
    const run = await reachClosure({ withAction: true });
    const preview = previewLongSessionCompletion(run, { definition });
    expect(preview.actionPlan).toBe("Envoyer une demande fictive de disponibilité.");
    const completed = completeLongSessionRun(run, {
      definition,
      summary: `${preview.summary}\nCorrection utilisateur fictive.`,
      actionPlan: preview.actionPlan,
      userConfirmed: true,
      now: atMinute(18),
    });
    expect(completed.result.summary).toContain("Correction utilisateur fictive.");
    expect(completed.result.actionPlan).toBe(preview.actionPlan);
  });

  it("autorise une vraie clôture anticipée après un premier élément confirmé", async () => {
    let run = await newRun();
    run = confirmAnswer(run, "sessionTopic", "Sujet fictif suffisant pour une clôture anticipée.", 1);
    const completed = completeLongSessionRun(run, {
      definition,
      completionMode: LONG_SESSION_COMPLETION_MODE.early,
      userConfirmed: true,
      now: atMinute(2),
    });
    expect(completed.result).toMatchObject({ completionMode: "early", actionPlan: null });
    expect(completed.run.phaseProgress[0].status).toBe("completed");
    expect(completed.run.phaseProgress[1].status).toBe("pending");
  });

  it("refuse une clôture normale prématurée et une synthèse non confirmée", async () => {
    let run = await newRun();
    run = confirmAnswer(run, "sessionTopic", "Sujet fictif.", 1);
    expect(() => completeLongSessionRun(run, {
      definition,
      userConfirmed: true,
      now: atMinute(2),
    })).toThrow(/atteint la phase de clôture/);
    expect(() => completeLongSessionRun(run, {
      definition,
      completionMode: "early",
      userConfirmed: false,
      now: atMinute(2),
    })).toThrow(/explicitement confirmée/);
  });

  it("rend la clôture idempotente", async () => {
    const run = await reachClosure();
    const first = completeLongSessionRun(run, { definition, userConfirmed: true, now: atMinute(17) });
    const second = completeLongSessionRun(first.run, { definition, userConfirmed: true, now: atMinute(18) });
    expect(second).toMatchObject({ outcome: "already_completed", idempotent: true });
    expect(second.run).toStrictEqual(first.run);
  });

  it("applique encore le garde safety à une synthèse corrigée avant clôture", async () => {
    const run = await reachClosure();
    const blockedText = "Fixture sensible : je veux mourir.";
    const result = completeLongSessionRun(run, {
      definition,
      summary: blockedText,
      userConfirmed: true,
      now: atMinute(17),
    });
    expect(result).toMatchObject({ blocked: true, code: "sensitive" });
    expect(result.run).toMatchObject({ status: "draft", safetyState: "interrupted" });
    expect(JSON.stringify(result)).not.toContain(blockedText);
  });

  it("traduit l’abandon en suppression du draft sans faux résultat", async () => {
    const run = await newRun();
    expect(abandonLongSessionRun(run)).toEqual({
      outcome: "abandoned",
      runId: "long-session-fixture-1",
      run: null,
    });
  });
});
