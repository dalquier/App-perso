import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_PROTOCOL_REFS,
  PROTOCOL_DEFINITIONS,
  createProtocolRegistry,
  protocolRegistry,
  validateProtocolDefinition,
} from "../src/protocols/catalog.js";
import { canonicalProtocolJson, protocolDefinitionDigest } from "../src/protocols/digest.js";
import {
  abandonProtocolRun,
  answerProtocolStep,
  completeProtocolRun,
  createProtocolRun,
  moveProtocolBack,
  previewProtocolRun,
} from "../src/protocols/engine.js";
import {
  gateProtocolText,
  normalizeProtocolText,
  unicodeCodePointLength,
} from "../src/safety/textGate.js";
import { SAFETY_MESSAGE } from "../src/safety/sensitiveGuard.js";

const clarifyFixture = JSON.parse(readFileSync(new URL("./fixtures/clarify-situation.json", import.meta.url), "utf8"));
const smallStepFixture = JSON.parse(readFileSync(new URL("./fixtures/take-small-step.json", import.meta.url), "utf8"));

const FIXED_START = new Date("2026-08-07T06:00:00.000Z");
const FIXED_ANSWER = new Date("2026-08-07T06:01:00.000Z");
const FIXED_COMPLETE = new Date("2026-08-07T06:10:00.000Z");
const RUN_ID = "protocol-run-fixture-001";
const RECORD_ID = "session-record-fixture-001";

const emptyState = (extra = {}) => ({ protocolRuns: [], sessionRecords: [], ...extra });
const clone = (value) => structuredClone(value);

async function start(protocolId, protocolVersion = "1.0.0", state = emptyState()) {
  return createProtocolRun(state, {
    protocolId,
    protocolVersion,
    now: FIXED_START,
    idFactory: () => RUN_ID,
  });
}

function runFrom(state) {
  return state.protocolRuns.find((item) => item.id === RUN_ID);
}

function answer(state, stepId, value, now = FIXED_ANSWER) {
  const control = answerProtocolStep(state, { runId: RUN_ID, stepId, value, now });
  if (!control.ok) throw new Error(`Réponse rejetée dans le helper: ${control.code}.`);
  return control.state;
}

async function answerFixture(fixture, state = null) {
  let next = state || await start(fixture.protocolId, fixture.protocolVersion);
  const definition = protocolRegistry.get(fixture.protocolId, fixture.protocolVersion);
  for (const step of definition.steps) {
    next = answer(next, step.id, fixture.answers[step.id] ?? "");
  }
  return next;
}

function expectDeepFrozen(value) {
  expect(Object.isFrozen(value)).toBe(true);
  if (!value || typeof value !== "object") return;
  for (const child of Object.values(value)) expectDeepFrozen(child);
}

describe("BUILD-04A — catalogue public versionné", () => {
  it("expose exactement les deux versions actives BUILD-04", () => {
    expect(ACTIVE_PROTOCOL_REFS).toEqual([
      { id: "equilibre.protocol.clarify-situation", version: "1.0.0" },
      { id: "equilibre.protocol.take-small-step", version: "1.0.0" },
    ]);
    expect(protocolRegistry.listActive().map(({ id, version }) => `${id}@${version}`)).toEqual([
      "equilibre.protocol.clarify-situation@1.0.0",
      "equilibre.protocol.take-small-step@1.0.0",
    ]);
  });

  it("retourne des copies défensives profondément immuables", () => {
    const first = protocolRegistry.get("equilibre.protocol.clarify-situation", "1.0.0");
    const second = protocolRegistry.get("equilibre.protocol.clarify-situation", "1.0.0");
    expect(first).not.toBe(second);
    expectDeepFrozen(first);
    expect(() => { first.steps[0].question = "mutation"; }).toThrow();
    expect(second.steps[0].question).toBe("Quelle situation voulez-vous clarifier, en une ou deux phrases ?");
  });

  it("autorise une version historique fictive et conserve une seule version active", () => {
    const active = protocolRegistry.get("equilibre.protocol.clarify-situation", "1.0.0");
    const historical = clone(active);
    historical.version = "0.9.0";
    historical.title = "Clarifier une situation — historique fictif";
    const registry = createProtocolRegistry([historical, active, PROTOCOL_DEFINITIONS[1]], {
      activeRefs: ACTIVE_PROTOCOL_REFS,
    });

    expect(registry.get(active.id, "0.9.0").title).toBe("Clarifier une situation — historique fictif");
    expect(registry.get(active.id, "1.0.0").title).toBe("Clarifier une situation");
    expect(registry.getActive(active.id).version).toBe("1.0.0");
    expect(registry.listVersions(active.id)).toEqual(["0.9.0", "1.0.0"]);
    expect(registry.listActive()).toHaveLength(2);
  });

  it("refuse une version active ambiguë pour un même protocolId", () => {
    const active = protocolRegistry.get("equilibre.protocol.clarify-situation", "1.0.0");
    const historical = clone(active);
    historical.version = "0.9.0";
    expect(() => createProtocolRegistry([historical, active, PROTOCOL_DEFINITIONS[1]], {
      activeRefs: [
        { id: active.id, version: "0.9.0" },
        { id: active.id, version: "1.0.0" },
        ACTIVE_PROTOCOL_REFS[1],
      ],
    })).toThrow(/active ambiguë/i);
  });

  it("refuse deux définitions portant le même couple id/version", () => {
    expect(() => createProtocolRegistry([PROTOCOL_DEFINITIONS[0], clone(PROTOCOL_DEFINITIONS[0])], {
      activeRefs: [ACTIVE_PROTOCOL_REFS[0]],
    })).toThrow(/Version dupliquée/);
  });

  it("valide tous les champs publics minimums", () => {
    const definition = clone(PROTOCOL_DEFINITIONS[0]);
    const required = [
      "id", "version", "title", "objective", "estimatedDuration", "warning", "useWhen",
      "doNotUseWhen", "steps", "summaryRule", "actionStepId", "abandonment",
      "safetyBehavior", "resultScreen", "limits",
    ];
    for (const field of required) {
      const invalid = clone(definition);
      delete invalid[field];
      expect(() => validateProtocolDefinition(invalid), field).toThrow(/Champ public requis manquant/);
    }
  });

  it("refuse les schémas d'étapes incohérents", () => {
    const cases = [
      (d) => { d.steps[0].id = ""; },
      (d) => { d.steps[1].order = 7; },
      (d) => { d.steps[0].label = ""; },
      (d) => { d.steps[0].question = ""; },
      (d) => { d.steps[0].maxLength = 0; },
      (d) => { d.steps[0].maxLength = 1.5; },
      (d) => { d.steps[0].required = "oui"; },
      (d) => { d.steps[0].resultRole = ""; },
    ];
    for (const mutate of cases) {
      const invalid = clone(PROTOCOL_DEFINITIONS[0]);
      mutate(invalid);
      expect(() => validateProtocolDefinition(invalid)).toThrow();
    }
  });

  it("refuse une règle de résumé incohérente", () => {
    const badSeparator = clone(PROTOCOL_DEFINITIONS[0]);
    badSeparator.summaryRule.separator = 3;
    expect(() => validateProtocolDefinition(badSeparator)).toThrow(/separator/);

    const unknownStep = clone(PROTOCOL_DEFINITIONS[0]);
    unknownStep.summaryRule.lines[0].stepId = "unknown";
    expect(() => validateProtocolDefinition(unknownStep)).toThrow(/inconnue/);

    const duplicateStep = clone(PROTOCOL_DEFINITIONS[0]);
    duplicateStep.summaryRule.lines[1].stepId = duplicateStep.summaryRule.lines[0].stepId;
    expect(() => validateProtocolDefinition(duplicateStep)).toThrow(/duplique/);

    const missingLine = clone(PROTOCOL_DEFINITIONS[0]);
    missingLine.summaryRule.lines.pop();
    expect(() => validateProtocolDefinition(missingLine)).toThrow(/absente du résumé/);
  });

  it("refuse toute fonction et donnée utilisateur dans une définition", () => {
    const functionDefinition = clone(PROTOCOL_DEFINITIONS[0]);
    functionDefinition.resultScreen.callback = () => true;
    expect(() => validateProtocolDefinition(functionDefinition)).toThrow(/fonction interdite/);

    const userDefinition = clone(PROTOCOL_DEFINITIONS[0]);
    userDefinition.resultScreen.userData = { fictional: true };
    expect(() => validateProtocolDefinition(userDefinition)).toThrow(/donnée utilisateur interdite/);
  });

  it("conserve le libellé mémoire exact de Clarifier une situation", () => {
    const definition = protocolRegistry.get("equilibre.protocol.clarify-situation", "1.0.0");
    expect(definition.resultScreen.actions).toContain("Proposer le point à vérifier dans ma mémoire");
    expect(definition.resultScreen.actions.join(" ")).not.toContain("uniquement si action non nulle");
    expect(definition.resultScreen.memoryActionCondition).toBe("action-non-null");
  });
});

describe("BUILD-04A — digest et porte de texte", () => {
  it("calcule un SHA-256 canonique stable, indépendant de l'ordre des clés et du champ digest", async () => {
    const source = { z: 2, a: { y: 2, x: 1 }, list: [{ b: 2, a: 1 }], digest: "ignore-me" };
    const reordered = { list: [{ a: 1, b: 2 }], a: { x: 1, y: 2 }, z: 2, digest: "other" };
    expect(canonicalProtocolJson(source)).toBe(canonicalProtocolJson(reordered));
    const first = await protocolDefinitionDigest(source);
    const second = await protocolDefinitionDigest(reordered);
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("préserve l'ordre des tableaux dans le digest", async () => {
    expect(await protocolDefinitionDigest({ values: [1, 2] })).not.toBe(
      await protocolDefinitionDigest({ values: [2, 1] }),
    );
  });

  it("normalise CRLF/CR en LF, applique NFC et trim extérieur", () => {
    expect(normalizeProtocolText("  e\u0301\r\nligne\rfin  ")).toBe("é\nligne\nfin");
  });

  it("compte les points de code Unicode plutôt que les unités UTF-16", () => {
    expect(unicodeCodePointLength("😀")).toBe(1);
    expect(gateProtocolText("😀", { required: true, maxLength: 1 })).toMatchObject({ ok: true, length: 1 });
    expect(gateProtocolText("😀a", { required: true, maxLength: 1 })).toMatchObject({ ok: false, code: "too_long" });
  });

  it("distingue obligatoire vide et facultatif vide", () => {
    expect(gateProtocolText("  ", { required: true, maxLength: 5 })).toMatchObject({ ok: false, code: "required" });
    expect(gateProtocolText("  ", { required: false, maxLength: 5 })).toMatchObject({ ok: true, value: "", length: 0 });
  });

  it("accepte max et refuse max+1", () => {
    expect(gateProtocolText("abc", { maxLength: 3 })).toMatchObject({ ok: true, length: 3 });
    expect(gateProtocolText("abcd", { maxLength: 3 })).toMatchObject({ ok: false, code: "too_long", length: 4 });
  });

  it("refuse les caractères de contrôle interdits", () => {
    expect(gateProtocolText("a\u0000b", { maxLength: 10 })).toMatchObject({ ok: false, code: "control_character" });
    expect(gateProtocolText("a\tb\nc", { maxLength: 10 })).toMatchObject({ ok: true });
  });

  it("bloque le contenu sensible sans recopier le texte utilisateur", () => {
    const raw = "je veux mourir";
    const result = gateProtocolText(raw, { required: true, maxLength: 50 });
    expect(result).toEqual({ ok: false, blocked: true, code: "sensitive", safetyMessage: SAFETY_MESSAGE });
    expect(JSON.stringify(result)).not.toContain(raw);
  });
});

describe("BUILD-04A — moteur linéaire", () => {
  it("ne permet de répondre qu'à l'étape courante au démarrage", async () => {
    const state = await start(clarifyFixture.protocolId);
    expect(runFrom(state).currentStepId).toBe("situation");
    expect(() => answerProtocolStep(state, {
      runId: RUN_ID,
      stepId: "observed_facts",
      value: "Un fait fictif.",
      now: FIXED_ANSWER,
    })).toThrow(/Saut d’étape interdit/);
    expect(runFrom(state).answers).toEqual({});
  });

  it("refuse tout saut d'étape futur par appel direct au moteur", async () => {
    let state = await start(smallStepFixture.protocolId);
    state = answer(state, "focus", smallStepFixture.answers.focus);
    expect(() => answerProtocolStep(state, {
      runId: RUN_ID,
      stepId: "small_step",
      value: smallStepFixture.answers.small_step,
      now: FIXED_ANSWER,
    })).toThrow(/Saut d’étape interdit/);
    expect(runFrom(state).answers.small_step).toBeUndefined();
  });

  it("permet d'éditer une réponse antérieure sans détruire les réponses suivantes", async () => {
    let state = await start(clarifyFixture.protocolId);
    state = answer(state, "situation", clarifyFixture.answers.situation);
    state = answer(state, "observed_facts", clarifyFixture.answers.observed_facts);
    state = answer(state, "interpretation", clarifyFixture.answers.interpretation);
    state = answer(state, "concrete_impact", clarifyFixture.answers.concrete_impact);
    const before = clone(runFrom(state).answers);
    state = answer(state, "situation", "Situation fictive corrigée.", new Date("2026-08-07T06:02:00.000Z"));
    const run = runFrom(state);
    expect(run.answers.situation.value).toBe("Situation fictive corrigée.");
    expect(run.answers.observed_facts).toEqual(before.observed_facts);
    expect(run.answers.interpretation).toEqual(before.interpretation);
    expect(run.answers.concrete_impact).toEqual(before.concrete_impact);
    expect(run.currentStepId).toBe("next_check");
  });

  it("autorise la réédition d'une étape future relative à un retour seulement si elle avait déjà été répondue", async () => {
    let state = await answerFixture(clarifyFixture);
    state = moveProtocolBack(state, { runId: RUN_ID, now: FIXED_ANSWER });
    expect(runFrom(state).currentStepId).toBe("concrete_impact");
    const control = answerProtocolStep(state, {
      runId: RUN_ID,
      stepId: "next_check",
      value: "Vérification fictive corrigée.",
      now: FIXED_ANSWER,
    });
    expect(control.ok).toBe(true);
    expect(control.run.answers.next_check.value).toBe("Vérification fictive corrigée.");
    expect(control.run.currentStepId).toBe("concrete_impact");
  });

  it("bloque le démarrage lorsqu'un ProtocolRun draft existe", async () => {
    const state = await start(clarifyFixture.protocolId);
    await expect(createProtocolRun(state, {
      protocolId: smallStepFixture.protocolId,
      protocolVersion: "1.0.0",
      now: FIXED_START,
      idFactory: () => "other-run",
    })).rejects.toThrow(/activité guidée est déjà en cours/i);
  });

  it("bloque une lastSession BUILD-01 inachevée sans la convertir", async () => {
    const legacy = { id: "legacy-session", completed: false, step: "thought", answers: { situation: "Fixture" } };
    const state = emptyState({ lastSession: legacy });
    await expect(createProtocolRun(state, {
      protocolId: clarifyFixture.protocolId,
      protocolVersion: "1.0.0",
      now: FIXED_START,
      idFactory: () => RUN_ID,
    })).rejects.toThrow(/BUILD-01 inachevée/);
    expect(state.lastSession).toEqual(legacy);
    expect(state.protocolRuns).toEqual([]);
  });

  it("autorise une lastSession BUILD-01 terminée sans la convertir", async () => {
    const legacy = { id: "legacy-session", completed: true, answers: { situation: "Fixture" } };
    const state = emptyState({ lastSession: legacy });
    const next = await start(clarifyFixture.protocolId, "1.0.0", state);
    expect(next.lastSession).toEqual(legacy);
    expect(next.protocolRuns).toHaveLength(1);
    expect(next.protocolRuns[0].sourceSessionId).toBeUndefined();
  });

  it("la dernière réponse ne complète pas automatiquement le run", async () => {
    const state = await answerFixture(clarifyFixture);
    const run = runFrom(state);
    expect(run.status).toBe("draft");
    expect(run.result).toBeUndefined();
    expect(run.sessionRecordId).toBeUndefined();
    expect(previewProtocolRun(state, { runId: RUN_ID, now: FIXED_COMPLETE }).actionText).toBe(clarifyFixture.expectedAction);
  });

  it("produit le résumé Clarifier caractère par caractère et actionStepId canonique", async () => {
    const state = await answerFixture(clarifyFixture);
    const preview = previewProtocolRun(state, { runId: RUN_ID, now: FIXED_COMPLETE });
    expect(preview.summary).toBe([
      `Situation : ${clarifyFixture.answers.situation}`,
      `Faits observés : ${clarifyFixture.answers.observed_facts}`,
      `Interprétation : ${clarifyFixture.answers.interpretation}`,
      `Effet concret : ${clarifyFixture.answers.concrete_impact}`,
      `À vérifier : ${clarifyFixture.answers.next_check}`,
    ].join("\n"));
    expect(preview.summary.endsWith("\n")).toBe(false);
    expect(preview.actionText).toBe(clarifyFixture.expectedAction);
  });

  it("retourne actionText null si next_check est facultatif et vide", async () => {
    const fixture = clone(clarifyFixture);
    fixture.answers.next_check = "";
    const state = await answerFixture(fixture);
    const preview = previewProtocolRun(state, { runId: RUN_ID, now: FIXED_COMPLETE });
    expect(preview.actionText).toBeNull();
    expect(preview.summary).not.toContain("À vérifier");
  });

  it("produit les métadonnées déterministes du protocole Faire un petit pas", async () => {
    const state = await answerFixture(smallStepFixture);
    const preview = previewProtocolRun(state, { runId: RUN_ID, now: FIXED_COMPLETE });
    expect(preview.actionText).toBe(smallStepFixture.expectedAction);
    expect(preview.actionContext).toBe(smallStepFixture.answers.focus);
    expect(preview.successBoundary).toBe(smallStepFixture.answers.minimum_result);
    expect(preview.firstMove).toBe(smallStepFixture.answers.first_move);
    expect(preview.startCue).toBe(smallStepFixture.answers.start_cue);
    expect(preview.fallbackAction).toBe(smallStepFixture.answers.fallback_step);
  });

  it("abandonne par suppression sans résidu", async () => {
    const state = await start(clarifyFixture.protocolId);
    const next = abandonProtocolRun(state, { runId: RUN_ID });
    expect(next.protocolRuns).toEqual([]);
    expect(next.sessionRecords).toEqual([]);
  });

  it("complète atomiquement avec un seul sessionRecord logique", async () => {
    const state = await answerFixture(smallStepFixture);
    const control = completeProtocolRun(state, {
      runId: RUN_ID,
      now: FIXED_COMPLETE,
      recordIdFactory: () => RECORD_ID,
    });
    expect(control).toMatchObject({ outcome: "completed", blocked: false, idempotent: false });
    expect(control.run.status).toBe("completed");
    expect(control.run.result).toBe(control.result);
    expect(control.run.sessionRecordId).toBe(RECORD_ID);
    expect(control.state.sessionRecords).toHaveLength(1);
    expect(control.sessionRecord).toMatchObject({
      id: RECORD_ID,
      recordType: "protocol",
      sourceSessionId: RUN_ID,
      protocolRef: { id: smallStepFixture.protocolId, version: smallStepFixture.protocolVersion },
      summary: control.result.summary,
      actionPlan: smallStepFixture.expectedAction,
    });
    expect(control.sessionRecord.answers).toEqual(smallStepFixture.answers);
    expectDeepFrozen(control.run);
    expectDeepFrozen(control.result);
    expectDeepFrozen(control.sessionRecord);
  });

  it("rend une seconde complétion explicitement idempotente sans nouveau record", async () => {
    const draft = await answerFixture(smallStepFixture);
    const first = completeProtocolRun(draft, {
      runId: RUN_ID,
      now: FIXED_COMPLETE,
      recordIdFactory: () => RECORD_ID,
    });
    const second = completeProtocolRun(first.state, {
      runId: RUN_ID,
      now: new Date("2026-08-07T06:11:00.000Z"),
      recordIdFactory: () => "must-not-be-used",
    });
    expect(second).toMatchObject({ outcome: "already_completed", blocked: false, idempotent: true });
    expect(second.state.sessionRecords).toHaveLength(1);
    expect(second.sessionRecord.id).toBe(RECORD_ID);
    expect(second.result).toBe(first.result);
  });

  it("interdit toute mutation d'un run completed", async () => {
    const draft = await answerFixture(clarifyFixture);
    const completed = completeProtocolRun(draft, {
      runId: RUN_ID,
      now: FIXED_COMPLETE,
      recordIdFactory: () => RECORD_ID,
    });
    expect(() => answerProtocolStep(completed.state, {
      runId: RUN_ID,
      stepId: "situation",
      value: "Nouvelle valeur",
      now: FIXED_COMPLETE,
    })).toThrow(/terminé est immuable/);
  });

  it("signale explicitement un agrégat sensible sans mutation ni fuite du texte", async () => {
    let state = await start(clarifyFixture.protocolId);
    state = answer(state, "situation", "je veux");
    state = answer(state, "observed_facts", "mourir");
    state = answer(state, "interpretation", "");
    state = answer(state, "concrete_impact", "");
    state = answer(state, "next_check", "");
    const before = clone(state);

    const control = completeProtocolRun(state, {
      runId: RUN_ID,
      now: FIXED_COMPLETE,
      recordIdFactory: () => RECORD_ID,
    });

    expect(control).toEqual({
      outcome: "blocked",
      blocked: true,
      idempotent: false,
      safetyMessage: SAFETY_MESSAGE,
    });
    expect(state).toEqual(before);
    expect(runFrom(state).status).toBe("draft");
    expect(runFrom(state).result).toBeUndefined();
    expect(runFrom(state).sessionRecordId).toBeUndefined();
    expect(state.sessionRecords).toHaveLength(0);
    const serializedControl = JSON.stringify(control);
    expect(serializedControl).not.toContain("je veux");
    expect(serializedControl).not.toContain("mourir");
  });
});

describe("BUILD-04A — fixtures", () => {
  it("conserve exclusivement les deux fixtures explicitement fictives du lot", () => {
    expect(clarifyFixture).toMatchObject({ fictional: true, protocolId: ACTIVE_PROTOCOL_REFS[0].id, protocolVersion: "1.0.0" });
    expect(smallStepFixture).toMatchObject({ fictional: true, protocolId: ACTIVE_PROTOCOL_REFS[1].id, protocolVersion: "1.0.0" });
    expect(clarifyFixture.fixtureId).toMatch(/^fixture-/);
    expect(smallStepFixture.fixtureId).toMatch(/^fixture-/);
  });
});
