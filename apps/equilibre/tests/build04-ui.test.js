import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { protocolRegistry } from "../src/protocols/catalog.js";
import {
  abandonProtocolRun,
  answerProtocolStep,
  completeProtocolRun,
  createProtocolRun,
  moveProtocolBack,
  previewProtocolRun,
} from "../src/protocols/engine.js";
import { gateProtocolText } from "../src/safety/textGate.js";
import { defaultState } from "../src/storage/localStore.js";

const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const fixedNow = new Date("2026-08-07T12:00:00.000Z");

function navSource() {
  return appSource.slice(appSource.indexOf("const PRIMARY_NAV"), appSource.indexOf("const escapeHtml"));
}

async function createRun(protocolId = "equilibre.protocol.clarify-situation") {
  const definition = protocolRegistry.getActive(protocolId);
  const state = await createProtocolRun(defaultState(), {
    protocolId: definition.id,
    protocolVersion: definition.version,
    now: fixedNow,
    idFactory: () => "run-ui-test",
  });
  return { definition, state, runId: "run-ui-test" };
}

function answer(state, runId, stepId, value) {
  const control = answerProtocolStep(state, { runId, stepId, value, now: fixedNow });
  expect(control.ok).toBe(true);
  return control.state;
}

async function completedClarification({ nextCheck = "" } = {}) {
  const { definition, runId } = await createRun();
  let state = (await createRun()).state;
  state = answer(state, runId, "situation", "Situation fictive.");
  state = answer(state, runId, "observed_facts", "Faits fictifs observés.");
  state = answer(state, runId, "interpretation", "Interprétation fictive.");
  state = answer(state, runId, "concrete_impact", "Impact fictif.");
  state = answer(state, runId, "next_check", nextCheck);
  return { definition, state, runId };
}

describe("Équilibre BUILD-04C1 — structure visible", () => {
  it("conserve exactement 5 onglets et remplace Séance par Protocoles", () => {
    const source = navSource();
    expect((source.match(/label:/g) || [])).toHaveLength(5);
    expect(source).toContain('label: "Protocoles"');
    expect(source).not.toContain('label: "Séance"');
  });

  it("n'ajoute aucun 6e onglet", () => {
    expect((navSource().match(/\{ id:/g) || [])).toHaveLength(5);
  });

  it("affiche exactement les 2 protocoles actifs du catalogue", () => {
    expect(protocolRegistry.listActive()).toHaveLength(2);
    expect(appSource).toContain('aria-label="Catalogue des protocoles"');
    expect(appSource).toContain("protocolRegistry.listActive()");
  });

  it("présente titre, objectif, durée, avertissement, usages, non-usages et limites", () => {
    for (const token of ["definition.title", "definition.objective", "definition.estimatedDuration", "definition.warning", "definition.useWhen", "definition.doNotUseWhen", "definition.limits"]) {
      expect(appSource).toContain(token);
    }
  });

  it("rend une seule question courante avec progression, aide repliée et compteur", () => {
    expect(appSource).toContain("const step = definition.steps.find");
    expect(appSource).toContain('class="protocol-help"');
    expect(appSource).toContain("Question ${stepIndex + 1} sur ${definition.steps.length}");
    expect(appSource).toContain("data-protocol-counter");
    expect(appSource).not.toContain("definition.steps.map((step)");
  });

  it("expose Retour, Continuer et Quitter dans le parcours", () => {
    expect(appSource).toContain("data-protocol-back");
    expect(appSource).toContain("Continuer →");
    expect(appSource).toContain("data-quit-protocol");
  });

  it("rend la reprise explicite et jamais automatique", () => {
    expect(appSource).toContain("data-resume-protocol");
    expect(appSource).toContain("reprise uniquement sur action");
    expect(appSource).toContain('const resumeProtocol = event.target.closest("[data-resume-protocol]")');
  });

  it("conserve la séance BUILD-01 inachevée dans une carte séparée", () => {
    expect(appSource).toContain("legacy-session-card");
    expect(appSource).toContain("Reprendre la séance BUILD-01");
    expect(appSource).toContain("jamais un troisième protocole");
  });

  it("demande confirmation avant abandon", () => {
    expect(appSource).toContain('confirm("Abandonner ce protocole ? Le brouillon sera supprimé.")');
    expect(appSource).toContain("abandonProtocolRun");
  });

  it("affiche un aperçu avant Terminer puis un résultat final", () => {
    expect(appSource).toContain("Aperçu avant validation");
    expect(appSource).toContain("previewProtocolRun");
    expect(appSource).toContain("data-complete-protocol");
    expect(appSource).toContain("Protocole terminé");
  });

  it("affiche l'interruption sensible renvoyée par le domaine sans texte utilisateur", () => {
    expect(appSource).toContain("control.safetyMessage");
    expect(appSource).toContain("Votre réponse sensible n’a pas été enregistrée");
    expect(appSource).not.toContain("completionSafetyAggregate");
  });
});

describe("Équilibre BUILD-04C1 — validation et moteur existant", () => {
  it("respecte validation obligatoire et facultative via textGate", () => {
    expect(gateProtocolText("", { required: true, maxLength: 20 })).toMatchObject({ ok: false, code: "required" });
    expect(gateProtocolText("", { required: false, maxLength: 20 })).toMatchObject({ ok: true, value: "" });
  });

  it("respecte le maxLength et le compteur Unicode", () => {
    expect(gateProtocolText("abc", { maxLength: 2 })).toMatchObject({ ok: false, code: "too_long", length: 3, maxLength: 2 });
    expect(appSource).toContain("[...event.target.value].length");
    expect(appSource).toContain("step.maxLength");
  });

  it("retourne à l'étape précédente avec moveProtocolBack", async () => {
    const { state: initial, runId } = await createRun();
    const advanced = answer(initial, runId, "situation", "Situation fictive.");
    const backed = moveProtocolBack(advanced, { runId, now: fixedNow });
    expect(backed.protocolRuns[0].currentStepId).toBe("situation");
  });

  it("reprend explicitement un brouillon existant sans en créer un autre", async () => {
    const { state } = await createRun();
    expect(state.protocolRuns).toHaveLength(1);
    expect(state.protocolRuns[0].status).toBe("draft");
    expect(appSource).toContain("state.protocolRuns.find((item) => item.id === resumeProtocol.dataset.resumeProtocol");
  });

  it("abandonne le brouillon via le moteur", async () => {
    const { state, runId } = await createRun();
    expect(abandonProtocolRun(state, { runId }).protocolRuns).toEqual([]);
  });

  it("produit l'aperçu puis termine explicitement", async () => {
    const { state, runId } = await completedClarification({ nextCheck: "Vérification fictive." });
    const preview = previewProtocolRun(state, { runId, now: fixedNow });
    expect(preview.summary).toContain("Situation : Situation fictive.");
    const completed = completeProtocolRun(state, { runId, now: fixedNow, recordIdFactory: () => "record-ui-test" });
    expect(completed.outcome).toBe("completed");
    expect(completed.run.status).toBe("completed");
    expect(completed.result.summary).toBe(preview.summary);
  });

  it("conserve actionText null pour Clarifier sans next_check", async () => {
    const { state, runId } = await completedClarification({ nextCheck: "" });
    expect(previewProtocolRun(state, { runId, now: fixedNow }).actionText).toBeNull();
    expect(appSource).toContain("Aucune action définie");
  });

  it("interrompt une réponse sensible sans mutation du run", async () => {
    const { state, runId } = await createRun();
    const before = structuredClone(state);
    const control = answerProtocolStep(state, {
      runId,
      stepId: "situation",
      value: "texte fictif sensible",
      now: fixedNow,
      sensitiveDetector: () => true,
    });
    expect(control).toMatchObject({ ok: false, blocked: true, code: "sensitive" });
    expect(state).toEqual(before);
  });
});

describe("Équilibre BUILD-04C1 — iPhone et accessibilité", () => {
  it("couvre safe areas, clavier et absence de scroll horizontal", () => {
    expect(cssSource).toContain("env(safe-area-inset-top)");
    expect(cssSource).toContain("env(safe-area-inset-bottom)");
    expect(cssSource).toContain("overflow-x:hidden");
    expect(cssSource).toContain("max-height:42dvh");
  });

  it("déclare les règles 320, 375, 390 et 430 px", () => {
    for (const width of [320, 375, 390, 430]) expect(cssSource).toContain(`@media (max-width:${width}px)`);
  });

  it("conserve thèmes et labels accessibles", () => {
    expect(cssSource).toContain(':root[data-theme="dark"]');
    expect(cssSource).toContain(':root[data-theme="system"]');
    expect(appSource).toContain('aria-label="Navigation principale"');
    expect(appSource).toContain('class="sr-only" for="protocol-answer"');
  });
});
