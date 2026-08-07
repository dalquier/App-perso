import { beforeAll, describe, expect, it, vi } from "vitest";
import { createSession } from "../src/domain/session.js";
import {
  applyMemoryCorrection,
  confirmMemory,
  proposeMemory,
  removeMemory,
  MEMORY_STATUS,
} from "../src/domain/memory.js";
import { createConversation } from "../src/domain/conversation.js";
import { createProtocolRun } from "../src/protocols/engine.js";
import { createStore, defaultState, STORAGE_KEY } from "../src/storage/localStore.js";

const memoryStorage = () => {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};

let integration;

beforeAll(async () => {
  const storage = memoryStorage();
  globalThis.localStorage = storage;
  globalThis.navigator = { userAgent: "Desktop" };
  globalThis.window = {
    navigator: globalThis.navigator,
    addEventListener: vi.fn(),
    matchMedia: () => ({ matches: false }),
  };
  globalThis.requestAnimationFrame = (callback) => callback();
  const appElement = { innerHTML: "", addEventListener: vi.fn() };
  globalThis.document = {
    documentElement: { dataset: {} },
    querySelector(selector) {
      if (selector === "#app") return appElement;
      if (selector === "main") return { focus: vi.fn() };
      return null;
    },
  };
  integration = await import("../src/app.js");
});

async function completedSmallStepState({ aggregateSensitive = false } = {}) {
  let state = await createProtocolRun(defaultState(), {
    protocolId: "equilibre.protocol.take-small-step",
    protocolVersion: "1.0.0",
    idFactory: () => "run-build04-c2",
    now: new Date("2026-08-07T10:00:00Z"),
  });
  const values = aggregateSensitive
    ? ["je veux", "un résultat simple", "mourir", "ouvrir le fichier", "", ""]
    : ["préparer une note", "deux lignes", "ouvrir le document", "écrire le titre", "après déjeuner", "ouvrir seulement le document"];
  const stepIds = ["focus", "minimum_result", "small_step", "first_move", "start_cue", "fallback_step"];
  stepIds.forEach((stepId, index) => {
    const result = integration.prepareProtocolAnswer(state, {
      runId: "run-build04-c2",
      stepId,
      value: values[index],
      now: new Date(`2026-08-07T10:0${index + 1}:00Z`),
    });
    expect(result.ok).toBe(true);
    state = result.state;
  });
  return state;
}

describe("BUILD-04C2 — chat transversal", () => {
  it("prépare un chat sûr avant persistance puis fournisseur", () => {
    const initial = defaultState();
    const result = integration.prepareChatSubmission(initial, "Question fictive sûre", { providerId: "provider-fixture" });
    expect(result.ok).toBe(true);
    expect(result.state.conversations).toHaveLength(1);
    expect(result.conversation.messages).toHaveLength(2);
    expect(result.conversation.messages[0]).toMatchObject({ role: "user", content: "Question fictive sûre" });
    expect(result.conversation.messages[1]).toMatchObject({ role: "assistant", provenance: "provider-fixture" });
    expect(initial.conversations).toEqual([]);
  });

  it("bloque le chat sensible avant conversation, message, titre, save et fournisseur", async () => {
    const initial = defaultState();
    const save = vi.fn(() => true);
    const provider = vi.fn();
    const result = integration.prepareChatSubmission(initial, "je veux mourir", { providerId: "provider-fixture" });
    if (result.ok) {
      save(result.state);
      await provider(result.conversation);
    }
    expect(result.blocked).toBe(true);
    expect(result.state).toBe(initial);
    expect(result.state.conversations).toEqual([]);
    expect(save).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });

  it("refuse un renommage sensible sans altérer le titre", () => {
    const conversation = createConversation({ title: "Titre sûr" });
    const result = integration.prepareConversationRename(conversation, "je veux mourir");
    expect(result.blocked).toBe(true);
    expect(result.conversation).toBe(conversation);
    expect(conversation.title).toBe("Titre sûr");
  });
});

describe("BUILD-04C2 — séance legacy", () => {
  it("ne persiste jamais une réponse legacy sensible", () => {
    const initial = { ...defaultState(), lastSession: createSession(new Date("2026-08-07T10:00:00Z")) };
    const result = integration.prepareLegacySessionAnswer(initial, "je veux mourir");
    expect(result.blocked).toBe(true);
    expect(result.state).toBe(initial);
    expect(result.state.lastSession.answers).toEqual({});
    expect(result.state.sessionRecords).toEqual([]);
  });
});

describe("BUILD-04C2 — protocoles et complétion", () => {
  it("persiste uniquement une réponse validée, jamais le texte non soumis", async () => {
    let state = await createProtocolRun(defaultState(), {
      protocolId: "equilibre.protocol.take-small-step",
      protocolVersion: "1.0.0",
      idFactory: () => "run-answer",
    });
    const draftText = "texte présent uniquement dans le champ";
    expect(state.protocolRuns[0].answers).toEqual({});
    expect(JSON.stringify(state)).not.toContain(draftText);
    const accepted = integration.prepareProtocolAnswer(state, { runId: "run-answer", stepId: "focus", value: "texte validé" });
    expect(accepted.ok).toBe(true);
    state = accepted.state;
    expect(state.protocolRuns[0].answers.focus.value).toBe("texte validé");
  });

  it("Terminer crée exactement un record versionné puis reste idempotent", async () => {
    const state = await completedSmallStepState();
    const first = integration.prepareProtocolCompletion(state, {
      runId: "run-build04-c2",
      recordIdFactory: () => "record-build04-c2",
      now: new Date("2026-08-07T10:10:00Z"),
    });
    expect(first.outcome).toBe("completed");
    expect(first.state.sessionRecords).toHaveLength(1);
    expect(first.sessionRecord).toMatchObject({
      id: "record-build04-c2",
      recordType: "protocol",
      sourceSessionId: "run-build04-c2",
      protocolRef: { id: "equilibre.protocol.take-small-step", version: "1.0.0" },
      actionPlan: "ouvrir le document",
    });
    expect(first.sessionRecord.summary).toContain("préparer une note");
    expect(first.state.memoryEntries).toEqual([]);

    const second = integration.prepareProtocolCompletion(first.state, { runId: "run-build04-c2" });
    expect(second.outcome).toBe("already_completed");
    expect(second.idempotent).toBe(true);
    expect(second.state.sessionRecords).toHaveLength(1);
  });

  it("recontrôle l'agrégat et bloque sans record en conservant le run draft", async () => {
    const state = await completedSmallStepState({ aggregateSensitive: true });
    expect(state.protocolRuns[0].status).toBe("draft");
    const result = integration.prepareProtocolCompletion(state, { runId: "run-build04-c2" });
    expect(result.blocked).toBe(true);
    expect(result.safetyMessage).toBeTruthy();
    expect(result.state).toBe(state);
    expect(result.state.protocolRuns[0].status).toBe("draft");
    expect(result.state.sessionRecords).toEqual([]);
  });
});

describe("BUILD-04C2 — mémoire explicite et sûre", () => {
  const record = {
    id: "record-memory",
    sourceSessionId: "run-memory",
    actionPlan: "Faire deux lignes",
  };

  it("n'ajoute aucune mémoire automatiquement et propose seulement sur action explicite", () => {
    const initial = { ...defaultState(), sessionRecords: [record] };
    expect(initial.memoryEntries).toEqual([]);
    const result = integration.prepareMemoryProposal(initial, record.id);
    expect(result.ok).toBe(true);
    expect(result.entry).toMatchObject({
      content: "Faire deux lignes",
      status: MEMORY_STATUS.proposed,
      source: { type: "session", sessionRecordId: "record-memory", sourceSessionId: "run-memory" },
    });
    expect(initial.memoryEntries).toEqual([]);
  });

  it("refuse une action nulle", () => {
    const initial = { ...defaultState(), sessionRecords: [{ ...record, id: "record-null", actionPlan: "" }] };
    expect(() => integration.prepareMemoryProposal(initial, "record-null")).toThrow("action non vide");
    expect(initial.memoryEntries).toEqual([]);
  });

  it("refuse une proposition sensible", () => {
    const initial = { ...defaultState(), sessionRecords: [{ ...record, id: "record-sensitive", actionPlan: "je veux mourir" }] };
    expect(() => integration.prepareMemoryProposal(initial, "record-sensitive")).toThrow();
    expect(initial.memoryEntries).toEqual([]);
  });

  it("refuse confirmation et correction sensibles en préservant l'ancien contenu", () => {
    const maliciousLegacy = {
      id: "memory-malicious",
      kind: "action",
      content: "je veux mourir",
      source: Object.freeze({ type: "session", sessionRecordId: "record-memory", sourceSessionId: "run-memory" }),
      status: MEMORY_STATUS.proposed,
      createdAt: "2026-08-07T10:00:00.000Z",
      updatedAt: "2026-08-07T10:00:00.000Z",
    };
    expect(() => confirmMemory(maliciousLegacy)).toThrow();
    expect(maliciousLegacy.status).toBe(MEMORY_STATUS.proposed);

    const safe = proposeMemory({ content: "Ancien contenu sûr", sessionRecordId: "record-memory", sourceSessionId: "run-memory", kind: "action" });
    const correction = applyMemoryCorrection(safe, "je veux mourir");
    expect(correction.blocked).toBe(true);
    expect(correction.entry).toBe(safe);
    expect(correction.entry.content).toBe("Ancien contenu sûr");
  });

  it("garde la provenance complète immuable pendant confirmation et correction", () => {
    const proposed = proposeMemory({ content: "Action sûre", sessionRecordId: "record-memory", sourceSessionId: "run-memory", kind: "action" });
    const source = proposed.source;
    expect(Object.isFrozen(source)).toBe(true);
    const confirmed = confirmMemory(proposed, new Date("2026-08-07T10:01:00Z"));
    const corrected = applyMemoryCorrection(confirmed, "Action sûre corrigée", new Date("2026-08-07T10:02:00Z")).entry;
    expect(confirmed.source).toBe(source);
    expect(corrected.source).toBe(source);
    expect(corrected.source).toEqual({ type: "session", sessionRecordId: "record-memory", sourceSessionId: "run-memory" });
  });

  it("supprime sans résurrection", () => {
    const proposed = proposeMemory({ content: "Action sûre", sessionRecordId: "record-memory", sourceSessionId: "run-memory", kind: "action" });
    expect(removeMemory([proposed], proposed.id)).toEqual([]);
  });
});

describe("BUILD-04C2 — persistance v4", () => {
  it("traite un save refusé comme un échec et recharge l'état canonique", () => {
    const canonical = { ...defaultState(), conversations: [createConversation({ title: "Canonique" })] };
    const stale = { ...defaultState(), conversations: [createConversation({ title: "Obsolète" })] };
    const fakeStore = { save: vi.fn(() => false), load: vi.fn(() => canonical) };
    const result = integration.persistPreparedState(fakeStore, stale);
    expect(result.ok).toBe(false);
    expect(result.state.conversations[0].title).toBe("Canonique");
    expect(result.state.conversations.some((item) => item.title === "Obsolète")).toBe(false);
  });

  it("désactivation/effacement ne republie pas un snapshot obsolète", () => {
    const storage = memoryStorage();
    const runtimeA = createStore(storage);
    const runtimeB = createStore(storage);
    const seeded = { ...defaultState(), conversations: [createConversation({ title: "À effacer" })] };
    expect(runtimeA.save(seeded)).toBe(true);
    runtimeA.load();
    const stale = runtimeB.load();
    runtimeA.clear();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(runtimeB.save(stale)).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
