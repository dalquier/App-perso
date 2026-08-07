import { describe, expect, it, vi } from "vitest";
import {
  BACKUP_KEYS,
  BUILD01_BACKUP_KEY,
  STORAGE_KEY,
  STORAGE_VERSION,
  V2_BACKUP_KEY,
  V3_BACKUP_KEY,
  V4_ROLLBACK_BACKUP_KEY,
  createStore,
  defaultState,
} from "../src/storage/localStore.js";

function createSharedStorage() {
  const backing = new Map();
  const wrapper = ({ failSet } = {}) => ({
    getItem(key) {
      return backing.has(key) ? backing.get(key) : null;
    },
    setItem(key, value) {
      if (failSet?.(key, value)) throw new Error("QuotaExceededError fictive");
      backing.set(key, String(value));
    },
    removeItem(key) {
      backing.delete(key);
    },
  });
  return { backing, wrapper };
}

function legacyV1() {
  return {
    version: 1,
    settings: { saveLocally: true, theme: "dark" },
    messages: [{ role: "user", content: "Fixture BUILD-01" }],
    lastSession: null,
  };
}

function legacyV2() {
  return {
    version: 2,
    settings: { saveLocally: true, theme: "dark" },
    conversations: [{ id: "conv-v2-fiction", title: "Conversation v2 fictive", messages: [] }],
    activeConversationId: "conv-v2-fiction",
    messages: [],
    lastSession: null,
  };
}

function legacyV3() {
  return {
    version: 3,
    settings: { saveLocally: true, theme: "dark" },
    conversations: [{ id: "conv-v3-fiction", title: "Conversation v3 fictive", messages: [] }],
    activeConversationId: "conv-v3-fiction",
    messages: [],
    lastSession: { id: "legacy-session-fiction", completed: true },
    sessionRecords: [{ id: "record-v3-fiction", sourceSessionId: "legacy-session-fiction" }],
    memoryEntries: [{
      id: "memory-v3-fiction",
      content: "Mémoire fictive",
      source: { type: "session", sessionRecordId: "record-v3-fiction", sourceSessionId: "legacy-session-fiction" },
      status: "confirmed",
    }],
  };
}

function seededState(storageRevision = 7) {
  return {
    ...defaultState(),
    storageRevision,
    conversations: [{ id: "conv-fiction-001", title: "Conversation fictive", messages: [] }],
    activeConversationId: "conv-fiction-001",
    protocolRuns: [{ id: "run-fiction-001", status: "draft" }],
    sessionRecords: [{ id: "record-fiction-001", sourceSessionId: "run-fiction-001" }],
    memoryEntries: [{ id: "memory-fiction-001", content: "Mémoire fictive" }],
  };
}

function parsePrimary(shared) {
  return JSON.parse(shared.backing.get(STORAGE_KEY));
}

describe("BUILD-04B — stockage local v4 cumulatif", () => {
  it("expose un état v4 par défaut avec protocolRuns et storageRevision", () => {
    expect(defaultState()).toMatchObject({
      version: 4,
      storageRevision: 0,
      conversations: [],
      protocolRuns: [],
      sessionRecords: [],
      memoryEntries: [],
    });
    expect(STORAGE_VERSION).toBe(4);
  });

  it("migre v1 au load, matérialise réellement la v4 puis permet save()", () => {
    const shared = createSharedStorage();
    const raw = JSON.stringify(legacyV1());
    shared.backing.set(STORAGE_KEY, raw);
    const store = createStore(shared.wrapper());

    const loaded = store.load();
    expect(loaded.version).toBe(4);
    expect(loaded.storageRevision).toBe(1);
    expect(shared.backing.get(BUILD01_BACKUP_KEY)).toBe(raw);
    expect(parsePrimary(shared).version).toBe(4);
    expect(store.save(loaded)).toBe(true);
    expect(parsePrimary(shared).storageRevision).toBe(2);
  });

  it("migre v2 au load, matérialise réellement la v4 puis permet save()", () => {
    const shared = createSharedStorage();
    const raw = JSON.stringify(legacyV2());
    shared.backing.set(STORAGE_KEY, raw);
    const store = createStore(shared.wrapper());

    const loaded = store.load();
    expect(loaded.version).toBe(4);
    expect(loaded.conversations[0].id).toBe("conv-v2-fiction");
    expect(shared.backing.get(V2_BACKUP_KEY)).toBe(raw);
    expect(parsePrimary(shared).version).toBe(4);
    expect(store.save(loaded)).toBe(true);
    expect(parsePrimary(shared).storageRevision).toBe(2);
  });

  it("migre v3 vers v4 sans perdre conversations, séance, records ni mémoire", () => {
    const shared = createSharedStorage();
    shared.backing.set(STORAGE_KEY, JSON.stringify(legacyV3()));
    const loaded = createStore(shared.wrapper()).load();

    expect(loaded.version).toBe(4);
    expect(loaded.storageRevision).toBe(1);
    expect(loaded.conversations[0].id).toBe("conv-v3-fiction");
    expect(loaded.lastSession.id).toBe("legacy-session-fiction");
    expect(loaded.sessionRecords[0].id).toBe("record-v3-fiction");
    expect(loaded.memoryEntries[0].id).toBe("memory-v3-fiction");
    expect(loaded.protocolRuns).toEqual([]);
  });

  it("sauvegarde la v3 brute bit à bit avant toute écriture v4", () => {
    const shared = createSharedStorage();
    const raw = `  ${JSON.stringify(legacyV3())}\n`;
    shared.backing.set(STORAGE_KEY, raw);

    createStore(shared.wrapper()).load();

    expect(shared.backing.get(V3_BACKUP_KEY)).toBe(raw);
    expect(parsePrimary(shared).version).toBe(4);
  });

  it("n'écrase jamais les backups BUILD-01, v2 ou v3 existants", () => {
    const cases = [
      [legacyV1(), BUILD01_BACKUP_KEY, "backup-build01-préexistant"],
      [legacyV2(), V2_BACKUP_KEY, "backup-v2-préexistant"],
      [legacyV3(), V3_BACKUP_KEY, "backup-v3-préexistant"],
    ];

    for (const [legacy, key, sentinel] of cases) {
      const shared = createSharedStorage();
      shared.backing.set(key, sentinel);
      shared.backing.set(STORAGE_KEY, JSON.stringify(legacy));
      createStore(shared.wrapper()).load();
      expect(shared.backing.get(key)).toBe(sentinel);
    }
  });

  it("relit une v4 migrée de façon idempotente sans réécrire le backup v3", () => {
    const shared = createSharedStorage();
    const raw = JSON.stringify(legacyV3());
    shared.backing.set(STORAGE_KEY, raw);
    const firstStore = createStore(shared.wrapper());
    const first = firstStore.load();
    const persisted = shared.backing.get(STORAGE_KEY);
    const backup = shared.backing.get(V3_BACKUP_KEY);

    const second = createStore(shared.wrapper()).load();

    expect(second).toEqual(first);
    expect(shared.backing.get(STORAGE_KEY)).toBe(persisted);
    expect(shared.backing.get(V3_BACKUP_KEY)).toBe(backup);
  });

  it("une erreur de quota pendant la migration ne remplace jamais la valeur legacy", () => {
    const shared = createSharedStorage();
    const raw = JSON.stringify(legacyV3());
    shared.backing.set(STORAGE_KEY, raw);
    const storage = shared.wrapper({
      failSet: (key, value) => key === STORAGE_KEY && JSON.parse(String(value)).version === 4,
    });

    const loaded = createStore(storage).load();

    expect(loaded.writesBlocked).toBe(true);
    expect(shared.backing.get(STORAGE_KEY)).toBe(raw);
    expect(shared.backing.get(V3_BACKUP_KEY)).toBe(raw);
  });

  it("une erreur de transformation pendant la migration ne remplace jamais la valeur legacy", () => {
    const shared = createSharedStorage();
    const raw = JSON.stringify(legacyV3());
    shared.backing.set(STORAGE_KEY, raw);
    const originalStringify = JSON.stringify;
    const spy = vi.spyOn(JSON, "stringify").mockImplementation((value, ...args) => {
      if (value?.version === 4) throw new TypeError("Transformation fictive impossible");
      return originalStringify(value, ...args);
    });

    try {
      const loaded = createStore(shared.wrapper()).load();
      expect(loaded.writesBlocked).toBe(true);
      expect(shared.backing.get(STORAGE_KEY)).toBe(raw);
      expect(shared.backing.get(V3_BACKUP_KEY)).toBe(raw);
    } finally {
      spy.mockRestore();
    }
  });

  it("un JSON non vide corrompu bloque les écritures et conserve la valeur brute", () => {
    const shared = createSharedStorage();
    const raw = "{json-fictif-incomplet";
    shared.backing.set(STORAGE_KEY, raw);
    const store = createStore(shared.wrapper());
    const loaded = store.load();

    expect(loaded.writesBlocked).toBe(true);
    expect(store.save(defaultState())).toBe(false);
    expect(shared.backing.get(STORAGE_KEY)).toBe(raw);
  });

  it("une version future bloque les écritures et conserve la valeur brute", () => {
    const shared = createSharedStorage();
    const raw = JSON.stringify({ version: 99, storageRevision: 12, fixture: "future" });
    shared.backing.set(STORAGE_KEY, raw);
    const store = createStore(shared.wrapper());
    const loaded = store.load();

    expect(loaded.writesBlocked).toBe(true);
    expect(loaded.storageError).toContain("Version");
    expect(store.save(defaultState())).toBe(false);
    expect(shared.backing.get(STORAGE_KEY)).toBe(raw);
  });

  it("rollback v4→v3 sauvegarde d'abord la v4 puis restaure la v3 brute sans écraser le backup v4", () => {
    const shared = createSharedStorage();
    const rawV3 = JSON.stringify(legacyV3());
    const currentV4 = JSON.stringify({ ...defaultState(), storageRevision: 4, protocolRuns: [{ id: "run-v4-fiction" }] });
    shared.backing.set(V3_BACKUP_KEY, rawV3);
    shared.backing.set(STORAGE_KEY, currentV4);
    const store = createStore(shared.wrapper());
    store.load();

    expect(store.rollbackToV3()).toBe(true);
    expect(shared.backing.get(V4_ROLLBACK_BACKUP_KEY)).toBe(currentV4);
    expect(shared.backing.get(STORAGE_KEY)).toBe(rawV3);

    const sentinel = shared.backing.get(V4_ROLLBACK_BACKUP_KEY);
    shared.backing.set(STORAGE_KEY, JSON.stringify({ ...defaultState(), storageRevision: 8 }));
    expect(createStore(shared.wrapper()).rollbackToV3()).toBe(true);
    expect(shared.backing.get(V4_ROLLBACK_BACKUP_KEY)).toBe(sentinel);
  });

  it("clear() supprime la clé principale et exactement les quatre backups", () => {
    const shared = createSharedStorage();
    shared.backing.set(STORAGE_KEY, JSON.stringify({ ...defaultState(), storageRevision: 3 }));
    for (const key of BACKUP_KEYS) shared.backing.set(key, `fixture-${key}`);
    const store = createStore(shared.wrapper());
    store.load();

    store.clear();

    expect(shared.backing.has(STORAGE_KEY)).toBe(false);
    expect(BACKUP_KEYS).toHaveLength(4);
    for (const key of BACKUP_KEYS) expect(shared.backing.has(key)).toBe(false);
  });

  it("protocolRuns persistent en v4 sans interprétation métier", () => {
    const shared = createSharedStorage();
    const store = createStore(shared.wrapper());
    const run = { id: "run-fiction-persisted", status: "draft", arbitrarySerializableField: { value: 3 } };

    expect(store.save({ ...defaultState(), protocolRuns: [run] })).toBe(true);
    expect(store.load().protocolRuns).toEqual([run]);
  });

  it("refuse une révision obsolète lorsqu'une révision plus récente existe", () => {
    const shared = createSharedStorage();
    const initial = { ...defaultState(), storageRevision: 3 };
    shared.backing.set(STORAGE_KEY, JSON.stringify(initial));
    const store = createStore(shared.wrapper());
    const stale = store.load();
    shared.backing.set(STORAGE_KEY, JSON.stringify({ ...defaultState(), storageRevision: 4 }));

    expect(store.save(stale)).toBe(false);
    expect(parsePrimary(shared).storageRevision).toBe(4);
  });

  it("un événement storage invalide un runtime chargé avant la modification", () => {
    const shared = createSharedStorage();
    const raw1 = JSON.stringify({ ...defaultState(), storageRevision: 1 });
    const raw2 = JSON.stringify({ ...defaultState(), storageRevision: 2 });
    shared.backing.set(STORAGE_KEY, raw1);
    const store = createStore(shared.wrapper());
    const stale = store.load();
    shared.backing.set(STORAGE_KEY, raw2);

    expect(store.handleStorageEvent({ key: STORAGE_KEY, oldValue: raw1, newValue: raw2 })).toBe(true);
    expect(store.save(stale)).toBe(false);
    expect(shared.backing.get(STORAGE_KEY)).toBe(raw2);
  });

  it("deux wrappers distincts partageant le même stockage refusent le second écrivain obsolète", () => {
    const shared = createSharedStorage();
    shared.backing.set(STORAGE_KEY, JSON.stringify({ ...defaultState(), storageRevision: 2 }));
    const runtimeA = createStore(shared.wrapper());
    const runtimeB = createStore(shared.wrapper());
    const stateA = runtimeA.load();
    const staleB = runtimeB.load();

    expect(runtimeA.save({ ...stateA, protocolRuns: [{ id: "run-a-fiction" }] })).toBe(true);
    const afterA = shared.backing.get(STORAGE_KEY);
    expect(runtimeB.save(staleB)).toBe(false);
    expect(shared.backing.get(STORAGE_KEY)).toBe(afterA);
  });

  it("refuse toujours la sauvegarde d'un runtime obsolète tant que STORAGE_KEY reste absente", () => {
    const shared = createSharedStorage();
    const initial = seededState(7);
    shared.backing.set(STORAGE_KEY, JSON.stringify(initial));

    const runtimeA = createStore(shared.wrapper());
    const runtimeB = createStore(shared.wrapper());
    runtimeA.load();
    const staleState = runtimeB.load();

    runtimeA.clear();

    expect(shared.backing.has(STORAGE_KEY)).toBe(false);
    expect(runtimeB.save(staleState)).toBe(false);
    expect(shared.backing.has(STORAGE_KEY)).toBe(false);
  });

  it("réactive un état vierge en N+1 puis refuse l'ancien runtime sans événement storage et sans résurrection", () => {
    const shared = createSharedStorage();
    const initialRevision = 7;
    const initial = seededState(initialRevision);
    shared.backing.set(STORAGE_KEY, JSON.stringify(initial));
    for (const key of BACKUP_KEYS) shared.backing.set(key, `backup-fictif-${key}`);

    const runtimeA = createStore(shared.wrapper());
    const runtimeB = createStore(shared.wrapper());
    runtimeA.load();
    const staleState = runtimeB.load();

    runtimeA.clear();
    expect(shared.backing.has(STORAGE_KEY)).toBe(false);
    for (const key of BACKUP_KEYS) expect(shared.backing.has(key)).toBe(false);

    expect(runtimeA.save(defaultState())).toBe(true);
    const blankState = parsePrimary(shared);

    expect(blankState.version).toBe(STORAGE_VERSION);
    expect(blankState.storageRevision).toBe(initialRevision + 1);
    expect(blankState.conversations).toEqual([]);
    expect(blankState.protocolRuns).toEqual([]);
    expect(blankState.sessionRecords).toEqual([]);
    expect(blankState.memoryEntries).toEqual([]);

    expect(runtimeB.save(staleState)).toBe(false);
    expect(parsePrimary(shared)).toEqual(blankState);
  });

  it("l'autorisation locale après clear() refuse un état non vierge mais permet ensuite une vraie réactivation vierge", () => {
    const shared = createSharedStorage();
    shared.backing.set(STORAGE_KEY, JSON.stringify(seededState(11)));
    const store = createStore(shared.wrapper());
    const old = store.load();

    store.clear();
    expect(store.save(old)).toBe(false);
    expect(shared.backing.has(STORAGE_KEY)).toBe(false);

    expect(store.save(defaultState())).toBe(true);
    expect(parsePrimary(shared)).toMatchObject({
      storageRevision: 12,
      conversations: [],
      protocolRuns: [],
      sessionRecords: [],
      memoryEntries: [],
    });
  });
});
