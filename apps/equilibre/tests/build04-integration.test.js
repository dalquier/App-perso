import { beforeAll, describe, expect, it, vi } from "vitest";
import { createSession } from "../src/domain/session.js";
import { applyMemoryCorrection, confirmMemory, proposeMemory, removeMemory, MEMORY_STATUS } from "../src/domain/memory.js";
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
  globalThis.localStorage = memoryStorage();
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Desktop" }, configurable: true });
  globalThis.window = { navigator: globalThis.navigator, addEventListener: vi.fn(), matchMedia: () => ({ matches: false }) };
  globalThis.requestAnimationFrame = (callback) => callback();
  const appElement = { innerHTML: "", addEventListener: vi.fn() };
  globalThis.document = {
    documentElement: { dataset: {} },
    querySelector: (selector) => selector === "#app" ? appElement : selector === "main" ? { focus: vi.fn() } : null,
  };
  integration = await import("../src/app.js");
});

async function smallStepState({ aggregateSensitive = false } = {}) {
  let state = await createProtocolRun(defaultState(), {
    protocolId: "equilibre.protocol.take-small-step",
    protocolVersion: "1.0.0",
    idFactory: () => "run-c2",
    now: new Date("2026-08-07T10:00:00Z"),
  });
  const ids = ["focus", "minimum_result", "small_step", "first_move", "start_cue", "fallback_step"];
  const values = aggregateSensitive
    ? ["je veux", "mourir", "ouvrir le document", "écrire le titre", "", ""]
    : ["préparer une note", "deux lignes", "ouvrir le document", "écrire le titre", "après déjeuner", "ouvrir seulement le document"];
  ids.forEach((stepId, index) => {
    const result = integration.prepareProtocolAnswer(state, { runId: "run-c2", stepId, value: values[index] });
    expect(result.ok).toBe(true);
    state = result.state;
  });
  return state;
}

describe("BUILD-04C2 — chat", () => {
  it("accepte le chat sûr", () => {
    const initial = defaultState();
    const result = integration.prepareChatSubmission(initial, "Question fictive sûre", { providerId: "provider-fixture" });
    expect(result.ok).toBe(true);
    expect(result.state.conversations).toHaveLength(1);
    expect(result.conversation.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(initial.conversations).toEqual([]);
  });

  it("bloque avant conversation, message, titre, save et fournisseur", async () => {
    const initial = defaultState();
    const save = vi.fn();
    const provider = vi.fn();
    const result = integration.prepareChatSubmission(initial, "je veux mourir");
    if (result.ok) { save(result.state); await provider(result.conversation); }
    expect(result.blocked).toBe(true);
    expect(result.state).toBe(initial);
    expect(initial.conversations).toEqual([]);
    expect(save).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });

  it("bloque le renommage sensible", () => {
    const conversation = createConversation({ title: "Titre sûr" });
    const result = integration.prepareConversationRename(conversation, "je veux mourir");
    expect(result.blocked).toBe(true);
    expect(result.conversation).toBe(conversation);
    expect(conversation.title).toBe("Titre sûr");
  });
});

describe("BUILD-04C2 — séance legacy", () => {
  it("ne conserve aucun contenu bloqué", () => {
    const initial = { ...defaultState(), lastSession: createSession() };
    const result = integration.prepareLegacySessionAnswer(initial, "je veux mourir");
    expect(result.blocked).toBe(true);
    expect(result.state).toBe(initial);
    expect(initial.lastSession.answers).toEqual({});
    expect(initial.sessionRecords).toEqual([]);
  });
});

describe("BUILD-04C2 — protocoles", () => {
  it("persiste uniquement le texte validé", async () => {
    let state = await createProtocolRun(defaultState(), {
      protocolId: "equilibre.protocol.take-small-step",
      protocolVersion: "1.0.0",
      idFactory: () => "run-answer",
    });
    const nonSubmitted = "texte seulement dans le champ";
    expect(JSON.stringify(state)).not.toContain(nonSubmitted);
    const result = integration.prepareProtocolAnswer(state, { runId: "run-answer", stepId: "focus", value: "texte validé" });
    expect(result.ok).toBe(true);
    state = result.state;
    expect(state.protocolRuns[0].answers.focus.value).toBe("texte validé");
  });

  it("Terminer crée un seul record versionné et reste idempotent", async () => {
    const state = await smallStepState();
    const first = integration.prepareProtocolCompletion(state, {
      runId: "run-c2",
      recordIdFactory: () => "record-c2",
      now: new Date("2026-08-07T10:10:00Z"),
    });
    expect(first.state.sessionRecords).toHaveLength(1);
    expect(first.sessionRecord).toMatchObject({
      id: "record-c2",
      sourceSessionId: "run-c2",
      protocolRef: { id: "equilibre.protocol.take-small-step", version: "1.0.0" },
      actionPlan: "ouvrir le document",
    });
    expect(first.sessionRecord.summary).toContain("préparer une note");
    expect(first.state.memoryEntries).toEqual([]);
    const second = integration.prepareProtocolCompletion(first.state, { runId: "run-c2" });
    expect(second.idempotent).toBe(true);
    expect(second.state.sessionRecords).toHaveLength(1);
  });

  it("bloque l'agrégat sensible avec zéro record et run draft", async () => {
    const state = await smallStepState({ aggregateSensitive: true });
    const result = integration.prepareProtocolCompletion(state, { runId: "run-c2" });
    expect(result.blocked).toBe(true);
    expect(result.safetyMessage).toBeTruthy();
    expect(result.state).toBe(state);
    expect(result.state.protocolRuns[0].status).toBe("draft");
    expect(result.state.sessionRecords).toEqual([]);
  });
});

describe("BUILD-04C2 — mémoire", () => {
  const record = { id: "record-memory", sourceSessionId: "run-memory", actionPlan: "Faire deux lignes" };

  it("reste vide automatiquement puis crée seulement une proposition explicite", () => {
    const initial = { ...defaultState(), sessionRecords: [record] };
    expect(initial.memoryEntries).toEqual([]);
    const result = integration.prepareMemoryProposal(initial, record.id);
    expect(result.entry).toMatchObject({
      content: "Faire deux lignes",
      status: MEMORY_STATUS.proposed,
      source: { type: "session", sessionRecordId: "record-memory", sourceSessionId: "run-memory" },
    });
    expect(initial.memoryEntries).toEqual([]);
  });

  it("refuse l'action nulle et la proposition sensible", () => {
    const empty = { ...defaultState(), sessionRecords: [{ ...record, id: "empty", actionPlan: "" }] };
    expect(() => integration.prepareMemoryProposal(empty, "empty")).toThrow("action non vide");
    const sensitive = { ...defaultState(), sessionRecords: [{ ...record, id: "sensitive", actionPlan: "je veux mourir" }] };
    expect(() => integration.prepareMemoryProposal(sensitive, "sensitive")).toThrow();
    expect(sensitive.memoryEntries).toEqual([]);
  });

  it("refuse confirmation/correction sensibles et préserve l'ancien contenu", () => {
    const malicious = {
      id: "mem-bad",
      kind: "action",
      content: "je veux mourir",
      source: Object.freeze({ type: "session", sessionRecordId: record.id, sourceSessionId: record.sourceSessionId }),
      status: MEMORY_STATUS.proposed,
      createdAt: "2026-08-07T10:00:00.000Z",
      updatedAt: "2026-08-07T10:00:00.000Z",
    };
    expect(() => confirmMemory(malicious)).toThrow();
    const safe = proposeMemory({ content: "Ancien contenu sûr", sessionRecordId: record.id, sourceSessionId: record.sourceSessionId, kind: "action" });
    const correction = applyMemoryCorrection(safe, "je veux mourir");
    expect(correction.blocked).toBe(true);
    expect(correction.entry).toBe(safe);
    expect(safe.content).toBe("Ancien contenu sûr");
  });

  it("conserve une provenance complète immuable", () => {
    const proposed = proposeMemory({ content: "Action sûre", sessionRecordId: record.id, sourceSessionId: record.sourceSessionId, kind: "action" });
    const source = proposed.source;
    const confirmed = confirmMemory(proposed);
    const corrected = applyMemoryCorrection(confirmed, "Action corrigée").entry;
    expect(Object.isFrozen(source)).toBe(true);
    expect(confirmed.source).toBe(source);
    expect(corrected.source).toBe(source);
    expect(source).toEqual({ type: "session", sessionRecordId: record.id, sourceSessionId: record.sourceSessionId });
  });

  it("supprime sans résurrection", () => {
    const entry = proposeMemory({ content: "Action sûre", sessionRecordId: record.id, sourceSessionId: record.sourceSessionId, kind: "action" });
    expect(removeMemory([entry], entry.id)).toEqual([]);
  });
});

describe("BUILD-04C2 — persistance v4", () => {
  it("traite save refusé comme échec et recharge le canonique", () => {
    const canonical = { ...defaultState(), conversations: [createConversation({ title: "Canonique" })] };
    const stale = { ...defaultState(), conversations: [createConversation({ title: "Obsolète" })] };
    const fakeStore = { save: vi.fn(() => false), load: vi.fn(() => canonical) };
    const result = integration.persistPreparedState(fakeStore, stale);
    expect(result.ok).toBe(false);
    expect(result.state.conversations[0].title).toBe("Canonique");
  });

  it("effacement/désactivation ne republie pas un snapshot obsolète", () => {
    const storage = memoryStorage();
    const runtimeA = createStore(storage);
    const runtimeB = createStore(storage);
    expect(runtimeA.save({ ...defaultState(), conversations: [createConversation({ title: "À effacer" })] })).toBe(true);
    runtimeA.load();
    const stale = runtimeB.load();
    runtimeA.clear();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(runtimeB.save(stale)).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
