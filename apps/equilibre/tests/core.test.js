import {
  applyMemoryCorrection,
  confirmMemory,
  createSessionRecord,
  proposeMemory,
  removeMemory,
  updateMemory,
  MEMORY_STATUS,
} from "../src/domain/memory.js";
import { describe, expect, it, vi } from "vitest";
import { answerSession, createSession } from "../src/domain/session.js";
import { addMessage, changeConversationMode, createConversation, createMessage, MESSAGE_STATUS, interruptConversationGeneration, renameConversation, updateConversationById, updateMessage } from "../src/domain/conversation.js";
import { createLocalConversationProvider, DEFAULT_LOCAL_STREAM_DELAY_MS } from "../src/providers/conversationProvider.js";
import { isIOSDevice, isStandaloneDisplay, localStorageContextNotice } from "../src/platform/displayMode.js";
import { scrollChatToBottom } from "../src/platform/viewport.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "../src/safety/sensitiveGuard.js";
import { BUILD01_BACKUP_KEY, V2_BACKUP_KEY, createStore, defaultState, migrateBuild01, migrateState, normalizeMemoryEntry, STORAGE_KEY, STORAGE_VERSION } from "../src/storage/localStore.js";

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
};
const saveWithConversation = (store, conversation) => store.save({ ...defaultState(), conversations: [conversation], activeConversationId: conversation.id });

describe("conversations BUILD-02", () => {
  it("crée une conversation", () => { const c = createConversation({ title: "Fixture" }); expect(c.id).toMatch(/^conv-/); expect(c.schemaVersion).toBe(2); expect(c.messages).toEqual([]); });
  it("ajoute et ordonne les messages", () => { let c = createConversation(); c = addMessage(c, createMessage({ role: "user", content: "A", now: new Date("2026-01-01") })); c = addMessage(c, createMessage({ role: "assistant", content: "B", now: new Date("2026-01-02") })); expect(c.messages.map((m) => m.content)).toEqual(["A", "B"]); });
  it("renomme", () => expect(renameConversation(createConversation(), "  Titre fictif  ").title).toBe("Titre fictif"));
  it("change de mode", () => expect(changeConversationMode(createConversation(), "action").mode).toBe("action"));
  it("isole les mutations entre conversations", () => { const a = addMessage(createConversation({ title: "A" }), createMessage({ role: "user", content: "A" })); const b = createConversation({ title: "B" }); expect(b.messages).toHaveLength(0); expect(a.id).not.toBe(b.id); });
  it("gère un message partiel interrompu", () => { let c = createConversation(); const m = createMessage({ role: "assistant", status: MESSAGE_STATUS.generating }); c = addMessage(c, m); c = updateMessage(c, m.id, { content: "début", status: MESSAGE_STATUS.interrupted, errorRef: "user_interruption" }); expect(c.messages[0].status).toBe("interrupted"); expect(c.messages[0].content).toBe("début"); });
  it("persiste réellement renommage et suppression", () => { const st = memoryStorage(), store = createStore(st); const renamed = renameConversation(createConversation(), "Titre persistant"); saveWithConversation(store, renamed); expect(store.load().conversations[0].title).toBe("Titre persistant"); store.save({ ...defaultState(), conversations: [], activeConversationId: null }); expect(store.load().conversations).toHaveLength(0); });
});

describe("stockage local versionné", () => {
  it("sauvegarde et reprend", () => { const st = memoryStorage(), store = createStore(st), state = defaultState(); const c = addMessage(createConversation(), createMessage({ role: "user", content: "fixture" })); state.conversations = [c]; state.activeConversationId = c.id; store.save(state); expect(store.load().conversations[0].messages).toHaveLength(1); expect(store.load().version).toBe(STORAGE_VERSION); });
  it("supprime une conversation", () => { const state = defaultState(), c = createConversation(); state.conversations = [c]; state.conversations = state.conversations.filter((x) => x.id !== c.id); expect(state.conversations).toHaveLength(0); });
  it("efface tout", () => { const st = memoryStorage(), store = createStore(st); store.save(defaultState()); store.clear(); expect(st.getItem(STORAGE_KEY)).toBeNull(); });
  it("respecte la persistance désactivée", () => { const st = memoryStorage(), store = createStore(st), state = defaultState(); state.settings.saveLocally = false; store.save(state); expect(st.getItem(STORAGE_KEY)).toBeNull(); });
  it("migre depuis BUILD-01", () => { const migrated = migrateBuild01({ version: 1, settings: { theme: "dark" }, messages: [{ role: "user", content: "ancienne fixture" }, { role: "assistant", content: "réponse", provider: "local-simulator" }] }); expect(migrated.conversations).toHaveLength(1); expect(migrated.conversations[0].messages.map((m) => m.content)).toEqual(["ancienne fixture", "réponse"]); expect(migrated.settings.theme).toBe("dark"); });
  it("migre BUILD-01 de façon déterministe deux fois", () => { const legacy = { version: 1, messages: [{ role: "user", content: "Même entrée" }, { role: "assistant", content: "Réponse" }] }; expect(migrateBuild01(legacy)).toEqual(migrateBuild01(legacy)); });
  it("conserve les messages valides malgré une date héritée invalide", () => { const migrated = migrateBuild01({ version: 1, messages: [{ role: "user", content: "Valide", createdAt: "date cassée" }, null, { role: "assistant", content: "Encore valide" }] }); expect(migrated.conversations[0].messages.map((m) => m.content)).toEqual(["Valide", "Encore valide"]); expect(migrated.conversations[0].messages[0].createdAt).toBe("2026-01-01T00:00:00.000Z"); });
  it("préserve une sauvegarde brute avant remplacement BUILD-01", () => { const st = memoryStorage(), store = createStore(st); const raw = JSON.stringify({ version: 1, messages: [{ role: "user", content: "archive" }] }); st.setItem(STORAGE_KEY, raw); store.load(); expect(st.getItem(BUILD01_BACKUP_KEY)).toBe(raw); });
  it("rejette sûrement une version inconnue", () => { const st = memoryStorage(); st.setItem(STORAGE_KEY, JSON.stringify({ version: 99, messages: ["legacy"] })); const loaded = createStore(st).load(); expect(loaded.conversations).toEqual([]); expect(loaded.storageError).toContain("Version"); });
  it("n'écrase pas une version inconnue avant réinitialisation explicite", () => { const st = memoryStorage(), store = createStore(st); const raw = JSON.stringify({ version: 99, messages: ["legacy"] }); st.setItem(STORAGE_KEY, raw); const loaded = store.load(); expect(store.save({ ...loaded, settings: { saveLocally: true, theme: "dark" } })).toBe(false); expect(st.getItem(STORAGE_KEY)).toBe(raw); store.clear(); store.save(defaultState()); expect(JSON.parse(st.getItem(STORAGE_KEY)).version).toBe(STORAGE_VERSION); });
  it("désactivation puis réactivation ne ressuscite pas les conversations", () => { const st = memoryStorage(), store = createStore(st); const old = addMessage(createConversation(), createMessage({ role: "user", content: "ancienne donnée locale" })); saveWithConversation(store, old); store.clear(); const clean = { ...defaultState(), settings: { ...defaultState().settings, saveLocally: true, theme: "dark" } }; store.save(clean); expect(store.load().conversations).toEqual([]); });
  it("normalise la reprise après fermeture", () => { const partial = addMessage(createConversation(), createMessage({ role: "assistant", content: "contenu gardé", status: MESSAGE_STATUS.partial })); const loaded = migrateState({ ...defaultState(), conversations: [partial], activeConversationId: partial.id }); expect(loaded.conversations[0].messages[0]).toMatchObject({ content: "contenu gardé", status: MESSAGE_STATUS.interrupted }); });
});

describe("fournisseur local", () => {
  it("garde un rythme perceptible par défaut", () => expect(DEFAULT_LOCAL_STREAM_DELAY_MS).toBeGreaterThanOrEqual(80));
  it("produit progressivement", async () => { const provider = createLocalConversationProvider({ delay: 0 }); let c = addMessage(createConversation({ mode: "clarify" }), createMessage({ role: "user", content: "Situation fictive" })); const chunks = []; for await (const chunk of provider.generate({ conversation: c })) chunks.push(chunk); expect(chunks.length).toBeGreaterThan(1); expect(chunks.at(-1).done).toBe(true); });
  it("s'interrompt sans corruption", async () => { const provider = createLocalConversationProvider({ delay: 0 }); const controller = new AbortController(); const c = addMessage(createConversation(), createMessage({ role: "user", content: "Fixture" })); const chunks = []; for await (const chunk of provider.generate({ conversation: c, signal: controller.signal })) { chunks.push(chunk); controller.abort(); } expect(chunks).toHaveLength(1); });
  it("rend une erreur fournisseur explicite", async () => { const provider = createLocalConversationProvider({ delay: 0 }); const c = addMessage(createConversation(), createMessage({ role: "user", content: "erreur fournisseur fictive" })); await expect(async () => { for await (const _ of provider.generate({ conversation: c })) {} }).rejects.toHaveProperty("code", "local_simulated_error"); expect(provider.errorMessage({ code: "x" }).status).toBe("error"); expect(provider.errorMessage({ code: "x" }).content).not.toBe(""); });
  it("déclare le mode dégradé local", () => expect(createLocalConversationProvider().degraded).toBe(true));
  it("isole deux générations et un changement de conversation", async () => { const provider = createLocalConversationProvider({ delay: 0 }); const a = addMessage(createConversation({ title: "A" }), createMessage({ role: "user", content: "alpha" })); const b = addMessage(createConversation({ title: "B" }), createMessage({ role: "user", content: "beta" })); const outputs = { [a.id]: "", [b.id]: "" }; await Promise.all([a, b].map(async (conversation) => { for await (const chunk of provider.generate({ conversation })) outputs[conversation.id] = chunk.content; })); expect(outputs[a.id]).toContain("Merci"); expect(outputs[b.id]).toContain("Merci"); expect(Object.keys(outputs)).toEqual([a.id, b.id]); });
  it("interruption et suppression arrêtent la génération", async () => { const provider = createLocalConversationProvider({ delay: 0 }); const controller = new AbortController(); const c = addMessage(createConversation(), createMessage({ role: "user", content: "supprimée" })); let seen = 0; for await (const _ of provider.generate({ conversation: c, signal: controller.signal })) { seen += 1; controller.abort(); } expect(seen).toBe(1); });
});

describe("contexte local Safari et PWA", () => {
  const safariIOS = { navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", standalone: false }, matchMedia: () => ({ matches: false }) };
  const pwaIOS = { navigator: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", standalone: true }, matchMedia: () => ({ matches: true }) };
  it("détecte Safari sur iPhone", () => { expect(isIOSDevice(safariIOS)).toBe(true); expect(isStandaloneDisplay(safariIOS)).toBe(false); });
  it("détecte la PWA installée", () => expect(isStandaloneDisplay(pwaIOS)).toBe(true));
  it("explique la séparation des espaces locaux dans Safari", () => expect(localStorageContextNotice(safariIOS)?.body).toContain("deux espaces locaux distincts"));
  it("explique l'absence de transfert automatique dans la PWA", () => expect(localStorageContextNotice(pwaIOS)?.body).toContain("ne sont pas transférées automatiquement"));
  it("n'affiche pas la note iPhone sur les autres plateformes", () => expect(localStorageContextNotice({ navigator: { userAgent: "Desktop" } })).toBeNull());
});

describe("affichage du fil", () => {
  it("recale la dernière réponse après chaque rendu", () => {
    const scrollIntoView = vi.fn();
    const scrollTo = vi.fn();
    const schedule = vi.fn((callback) => callback());
    const root = {
      documentElement: { scrollHeight: 2400 },
      defaultView: { scrollTo },
      querySelector: () => ({ lastElementChild: { scrollIntoView } }),
    };
    scrollChatToBottom(root, schedule);
    expect(schedule).toHaveBeenCalledOnce();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "end", behavior: "auto" });
    expect(scrollTo).toHaveBeenCalledWith({ top: 2400, behavior: "auto" });
  });
});

describe("séance guidée et garde-fou", () => {
  it("conserve les tests BUILD-01", () => { let s = createSession(new Date("2026-01-01T10:00:00Z")); for (const a of ["Situation fictive", "Inquiétude 4/10", "Cela paraît difficile", "Faire deux minutes"]) s = answerSession(s, a); expect(s.completed).toBe(true); });
  it("refuse une réponse vide", () => { const s = createSession(); expect(answerSession(s, "  ")).toBe(s); });
  it.each(["je veux mourir", "je pense au suicide", "je vais en finir", "je veux me faire du mal"])("intercepte %s", (t) => expect(detectSensitiveContent(t)).toBe(true));
  it("reste actif avant réponse ordinaire", () => expect(detectSensitiveContent("Je suis stressé par une tâche fictive")).toBe(false));
  it("oriente vers une aide humaine", () => expect(SAFETY_MESSAGE).toContain("3114"));
  it("bloque avant fournisseur sans l'appeler", async () => { const fakeProvider = { generate: vi.fn() }; const content = "je pense au suicide"; expect(detectSensitiveContent(content)).toBe(true); if (!detectSensitiveContent(content)) await fakeProvider.generate({}); expect(fakeProvider.generate).not.toHaveBeenCalled(); });
});

describe("changement de conversation pendant génération", () => {
  const fixture = () => {
    let a = createConversation({ title: "A", now: new Date("2026-01-01T10:00:00Z") });
    const user = createMessage({ role: "user", content: "Ma question importante", now: new Date("2026-01-01T10:00:01Z") });
    const assistant = createMessage({ role: "assistant", content: "Début", status: MESSAGE_STATUS.partial, now: new Date("2026-01-01T10:00:02Z") });
    a = addMessage(addMessage(a, user), assistant);
    const b = createConversation({ title: "B", now: new Date("2026-01-01T11:00:00Z") });
    return { state: { ...defaultState(), conversations: [a, b], activeConversationId: a.id }, a, b, user, assistant };
  };

  it("conserve la question utilisateur de A après interruption", () => {
    const { state, a, user } = fixture();
    const next = interruptConversationGeneration(state, a.id, "conversation_switched");
    expect(next.conversations.find((c) => c.id === a.id).messages.find((m) => m.id === user.id)).toMatchObject({ content: "Ma question importante", status: MESSAGE_STATUS.sent });
  });
  it("termine le message assistant de A avec la raison du changement", () => {
    const { state, a, assistant } = fixture();
    const next = interruptConversationGeneration(state, a.id, "conversation_switched");
    expect(next.conversations.find((c) => c.id === a.id).messages.find((m) => m.id === assistant.id)).toMatchObject({ content: "Début", status: MESSAGE_STATUS.interrupted, errorRef: "conversation_switched" });
  });
  it("n'affecte pas un autre identifiant de conversation", () => {
    const { state, a } = fixture();
    const next = interruptConversationGeneration(state, "conversation-absente", "conversation_switched");
    expect(next).toBe(state);
    expect(next.conversations.find((c) => c.id === a.id).messages.at(-1).status).toBe(MESSAGE_STATUS.partial);
  });
  it("préserve toutes les conversations en ne changeant que la cible", () => {
    const { state, a, b } = fixture();
    const next = updateConversationById(state, a.id, (conversation) => renameConversation(conversation, "A corrigée"));
    expect(next.conversations).toHaveLength(2);
    expect(next.conversations.find((c) => c.id === a.id).title).toBe("A corrigée");
    expect(next.conversations.find((c) => c.id === b.id)).toBe(b);
  });
  it("retourne l'état inchangé si la conversation cible est introuvable", () => {
    const { state } = fixture();
    expect(updateConversationById(state, "absente", (conversation) => conversation)).toBe(state);
  });
  it("permet une génération B indépendante après l'interruption de A", () => {
    const { state, a, b } = fixture();
    const interrupted = interruptConversationGeneration(state, a.id, "conversation_switched");
    const bAssistant = createMessage({ role: "assistant", content: "", status: MESSAGE_STATUS.generating });
    const next = updateConversationById(interrupted, b.id, (conversation) => addMessage(conversation, bAssistant), { makeActive: true });
    expect(next.activeConversationId).toBe(b.id);
    expect(next.conversations.find((c) => c.id === a.id).messages.at(-1).status).toBe(MESSAGE_STATUS.interrupted);
    expect(next.conversations.find((c) => c.id === b.id).messages.at(-1).status).toBe(MESSAGE_STATUS.generating);
  });
  it("n'interrompt pas un message déjà complet", () => {
    let conversation = createConversation();
    conversation = addMessage(conversation, createMessage({ role: "assistant", content: "Terminé", status: MESSAGE_STATUS.complete }));
    const state = { ...defaultState(), conversations: [conversation], activeConversationId: conversation.id };
    expect(interruptConversationGeneration(state, conversation.id, "conversation_switched").conversations[0].messages[0]).toMatchObject({ content: "Terminé", status: MESSAGE_STATUS.complete, errorRef: null });
  });
});

describe("BUILD-03 séances et mémoire contrôlée", () => {
  const completedSession = () => {
    let session = createSession(new Date("2026-02-01T10:00:00Z"));
    for (const answer of ["Réunion fictive", "Tension 5/10", "Je dois tout réussir", "Préparer deux lignes"]) {
      session = answerSession(session, answer);
    }
    return session;
  };

  it("crée un enregistrement structuré depuis une séance terminée", () => {
    const record = createSessionRecord(completedSession(), { now: new Date("2026-02-01T10:10:00Z") });
    expect(record.summary).toContain("Réunion fictive");
    expect(record.actionPlan).toBe("Préparer deux lignes");
    expect(record.sourceSessionId).toBeTruthy();
  });

  it("refuse une séance incomplète", () => {
    expect(() => createSessionRecord(createSession())).toThrow("terminée");
  });

  it("crée uniquement une proposition avant confirmation", () => {
    const record = createSessionRecord(completedSession(), { now: new Date("2026-02-01T10:10:00Z") });
    const entry = proposeMemory({ content: record.actionPlan, sessionRecordId: record.id, sourceSessionId: record.sourceSessionId, kind: "action", now: new Date("2026-02-01T10:11:00Z") });
    expect(entry).toMatchObject({ content: "Préparer deux lignes", status: MEMORY_STATUS.proposed, source: { type: "session", sessionRecordId: record.id, sourceSessionId: record.sourceSessionId } });
  });

  it("confirme une proposition immuablement", () => {
    const proposed = proposeMemory({ content: "Action fictive", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture", now: new Date("2026-02-01T10:11:00Z") });
    const confirmed = confirmMemory(proposed, new Date("2026-02-01T10:12:00Z"));
    expect(confirmed.status).toBe(MEMORY_STATUS.confirmed);
    expect(proposed.status).toBe(MEMORY_STATUS.proposed);
  });

  it("corrige puis supprime une mémoire", () => {
    const proposed = proposeMemory({ content: "Avant", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture", now: new Date("2026-02-01T10:11:00Z") });
    const corrected = updateMemory(proposed, "Après", new Date("2026-02-01T10:12:00Z"));
    expect(corrected.content).toBe("Après");
    expect(removeMemory([corrected], corrected.id)).toEqual([]);
  });

  it("migre la version 2 sans perte de conversation", () => {
    const conversation = addMessage(createConversation(), createMessage({ role: "user", content: "fixture v2" }));
    const migrated = migrateState({
      version: 2,
      settings: { saveLocally: true, theme: "dark" },
      conversations: [conversation],
      activeConversationId: conversation.id,
      lastSession: null,
    });
    expect(migrated.version).toBe(STORAGE_VERSION);
    expect(migrated.conversations[0].messages[0].content).toBe("fixture v2");
    expect(migrated.sessionRecords).toEqual([]);
    expect(migrated.memoryEntries).toEqual([]);
  });

  it("persiste séances et mémoires en version 4", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const sessionRecord = createSessionRecord(completedSession(), { now: new Date("2026-02-01T10:10:00Z") });
    const memoryEntry = confirmMemory(proposeMemory({ content: sessionRecord.actionPlan, sessionRecordId: sessionRecord.id, sourceSessionId: sessionRecord.sourceSessionId, now: new Date("2026-02-01T10:11:00Z") }), new Date("2026-02-01T10:12:00Z"));
    const state = { ...defaultState(), sessionRecords: [sessionRecord], memoryEntries: [memoryEntry] };
    store.save(state);
    expect(store.load()).toMatchObject({ version: STORAGE_VERSION, sessionRecords: [{ id: sessionRecord.id }], memoryEntries: [{ status: MEMORY_STATUS.confirmed }] });
  });

  it("l'effacement total supprime aussi la mémoire", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    store.save({ ...defaultState(), memoryEntries: [proposeMemory({ content: "Fixture", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture" })] });
    store.clear();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(store.load().memoryEntries).toEqual([]);
  });
});

describe("provenance des mémoires — chaîne vérifiée", () => {
  const completedSession = () => {
    let session = createSession(new Date("2026-03-01T10:00:00Z"));
    for (const answer of ["Présentation fictive", "Anxiété 6/10", "Je vais me tromper", "Répéter deux minutes"]) {
      session = answerSession(session, answer);
    }
    return session;
  };

  it("refuse un sessionRecordId vide dans proposeMemory", () => {
    expect(() => proposeMemory({ content: "Action fictive", sessionRecordId: "", sourceSessionId: "sess-x" })).toThrow("enregistrement");
  });

  it("refuse un sourceSessionId absent dans proposeMemory", () => {
    expect(() => proposeMemory({ content: "Action fictive", sessionRecordId: "rec-x", sourceSessionId: undefined })).toThrow("source");
  });

  it("structure de provenance complète — sessionRecordId et sourceSessionId distincts", () => {
    const session = completedSession();
    const record = createSessionRecord(session, { now: new Date("2026-03-01T10:10:00Z") });
    const entry = proposeMemory({ content: record.actionPlan, sessionRecordId: record.id, sourceSessionId: record.sourceSessionId, kind: "action" });
    expect(entry.source.type).toBe("session");
    expect(entry.source.sessionRecordId).toBe(record.id);
    expect(entry.source.sourceSessionId).toBe(session.id);
    expect(entry.source.sessionRecordId).not.toBe(entry.source.sourceSessionId);
    expect(session.completed).toBe(true);
  });

  it("source.sessionRecordId retrouve le bon enregistrement dans sessionRecords", () => {
    const record = createSessionRecord(completedSession(), { now: new Date("2026-03-01T10:10:00Z") });
    const entry = proposeMemory({ content: record.actionPlan, sessionRecordId: record.id, sourceSessionId: record.sourceSessionId });
    const sessionRecords = [record];
    const found = sessionRecords.find((r) => r.id === entry.source.sessionRecordId);
    expect(found).toBeDefined();
    expect(found.sourceSessionId).toBe(entry.source.sourceSessionId);
  });

  it("normalise une ancienne entrée source.id vers sessionRecordId + sourceSessionId", () => {
    const oldEntry = { id: "mem-1", content: "Ancien contenu", source: { type: "session", id: "rec-old-123" }, status: "proposed" };
    const normalized = normalizeMemoryEntry(oldEntry);
    expect(normalized.source.sessionRecordId).toBe("rec-old-123");
    expect(normalized.source.sourceSessionId).toBeNull();
    expect(normalized.source.id).toBeUndefined();
  });

  it("ne modifie pas une entrée déjà au nouveau format", () => {
    const newEntry = { id: "mem-2", content: "Contenu", source: { type: "session", sessionRecordId: "rec-new", sourceSessionId: "sess-new" }, status: "proposed" };
    expect(normalizeMemoryEntry(newEntry)).toBe(newEntry);
  });

  it("load() normalise les anciennes entrées source.id au chargement", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const oldState = JSON.stringify({
      version: 3,
      settings: { saveLocally: true, theme: "system" },
      conversations: [],
      activeConversationId: null,
      sessionRecords: [],
      memoryEntries: [{ id: "mem-legacy", content: "Ancienne mémoire", source: { type: "session", id: "record-legacy-id" }, status: "proposed" }],
    });
    storage.setItem(STORAGE_KEY, oldState);
    const loaded = store.load();
    expect(loaded.memoryEntries[0].source.sessionRecordId).toBe("record-legacy-id");
    expect(loaded.memoryEntries[0].source.sourceSessionId).toBeNull();
    expect(loaded.memoryEntries[0].source.id).toBeUndefined();
  });
});

describe("garde-fou avant correction de mémoire", () => {
  it("bloque un contenu sensible et retourne blocked:true", () => {
    const entry = proposeMemory({ content: "Plan fictif", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture" });
    const result = applyMemoryCorrection(entry, "je veux mourir");
    expect(result.blocked).toBe(true);
    expect(result.entry).toBe(entry);
  });

  it("applique la correction si le contenu est sûr", () => {
    const entry = proposeMemory({ content: "Plan fictif", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture" });
    const result = applyMemoryCorrection(entry, "Nouvelle action réaliste");
    expect(result.blocked).toBe(false);
    expect(result.entry.content).toBe("Nouvelle action réaliste");
  });

  it("rejette un contenu vide sans modification", () => {
    const entry = proposeMemory({ content: "Plan fictif", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture" });
    const result = applyMemoryCorrection(entry, "   ");
    expect(result.blocked).toBe(false);
    expect(result.entry).toBe(entry);
  });

  it("préserve l'entrée originale immuablement après correction sûre", () => {
    const entry = proposeMemory({ content: "Avant", sessionRecordId: "record-fixture", sourceSessionId: "session-fixture" });
    const result = applyMemoryCorrection(entry, "Après");
    expect(result.entry.content).toBe("Après");
    expect(entry.content).toBe("Avant");
  });
});

describe("sauvegarde brute réversible migration v2→v4", () => {
  it("préserve une sauvegarde brute avant migration v2→v4", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const conversation = addMessage(createConversation(), createMessage({ role: "user", content: "fixture v2" }));
    const raw = JSON.stringify({
      version: 2,
      settings: { saveLocally: true, theme: "dark" },
      conversations: [conversation],
      activeConversationId: conversation.id,
      lastSession: null,
    });
    storage.setItem(STORAGE_KEY, raw);
    store.load();
    expect(storage.getItem(V2_BACKUP_KEY)).toBe(raw);
  });

  it("ne crée pas de sauvegarde v2 si la version est déjà 4", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    store.save(defaultState());
    store.load();
    expect(storage.getItem(V2_BACKUP_KEY)).toBeNull();
  });

  it("la sauvegarde v2 permet de retrouver les conversations d'origine", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const conversation = addMessage(createConversation(), createMessage({ role: "user", content: "archive v2" }));
    const raw = JSON.stringify({ version: 2, settings: { saveLocally: true, theme: "system" }, conversations: [conversation], activeConversationId: conversation.id });
    storage.setItem(STORAGE_KEY, raw);
    store.load();
    const backup = JSON.parse(storage.getItem(V2_BACKUP_KEY));
    expect(backup.version).toBe(2);
    expect(backup.conversations[0].messages[0].content).toBe("archive v2");
  });

  it("idempotence — un deuxième load() ne réécrit pas la sauvegarde v2", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const conversation = addMessage(createConversation(), createMessage({ role: "user", content: "idempotence v2" }));
    const raw = JSON.stringify({ version: 2, settings: { saveLocally: true, theme: "system" }, conversations: [conversation], activeConversationId: conversation.id });
    storage.setItem(STORAGE_KEY, raw);
    store.load();
    const firstBackup = storage.getItem(V2_BACKUP_KEY);
    const raw2 = JSON.stringify({ ...JSON.parse(raw), conversations: [] });
    storage.setItem(STORAGE_KEY, raw2);
    store.load();
    expect(storage.getItem(V2_BACKUP_KEY)).toBe(firstBackup);
  });

  it("clear() supprime la sauvegarde v2", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const conversation = addMessage(createConversation(), createMessage({ role: "user", content: "fixture clear" }));
    const raw = JSON.stringify({ version: 2, settings: { saveLocally: true, theme: "system" }, conversations: [conversation], activeConversationId: conversation.id });
    storage.setItem(STORAGE_KEY, raw);
    store.load();
    expect(storage.getItem(V2_BACKUP_KEY)).not.toBeNull();
    store.clear();
    expect(storage.getItem(V2_BACKUP_KEY)).toBeNull();
  });

  it("désactivation de la persistance supprime la sauvegarde v2", () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    const conversation = addMessage(createConversation(), createMessage({ role: "user", content: "fixture disable" }));
    const raw = JSON.stringify({ version: 2, settings: { saveLocally: true, theme: "system" }, conversations: [conversation], activeConversationId: conversation.id });
    storage.setItem(STORAGE_KEY, raw);
    store.load();
    expect(storage.getItem(V2_BACKUP_KEY)).not.toBeNull();
    store.save({ ...defaultState(), settings: { saveLocally: false, theme: "system" } });
    expect(storage.getItem(V2_BACKUP_KEY)).toBeNull();
  });
});

describe("service worker non bloquant", () => {
  it("une erreur d'enregistrement SW ne propage pas d'exception", async () => {
    const failingRegister = vi.fn().mockRejectedValue(new Error("SecurityError: SW disabled"));
    const safeRegister = async () => {
      try {
        const reg = await failingRegister("/sw.js", { updateViaCache: "none" });
        await reg.update();
      } catch (_) {
      }
    };
    await expect(safeRegister()).resolves.toBeUndefined();
    expect(failingRegister).toHaveBeenCalledOnce();
  });

  it("une mise à jour SW qui échoue ne bloque pas le rendu", async () => {
    const failingUpdate = vi.fn().mockRejectedValue(new Error("NetworkError"));
    const fakeReg = { update: failingUpdate };
    const register = vi.fn().mockResolvedValue(fakeReg);
    const safeRegister = async () => {
      try {
        const reg = await register("/sw.js", { updateViaCache: "none" });
        await reg.update();
      } catch (_) {
      }
    };
    await expect(safeRegister()).resolves.toBeUndefined();
    expect(failingUpdate).toHaveBeenCalledOnce();
  });
});
