import { describe, expect, it } from "vitest";
import { createConversation, createMessage, addMessage } from "../src/domain/conversation.js";
import { EQUILIBRE_RELEASE } from "../src/release.js";
import {
  canonicalJson,
  createPortableBackup,
  deliverPortableBackup,
  inspectStateInventory,
  MAX_PORTABLE_BACKUP_BYTES,
  parsePortableBackup,
  portableBackupFilename,
  PORTABLE_BACKUP_FORMAT,
  PORTABLE_BACKUP_VERSION,
} from "../src/storage/dataSafety.js";
import {
  BACKUP_KEYS,
  createStore,
  defaultState,
  STORAGE_KEY,
  V4_RESTORE_BACKUP_KEY,
  V5_ACTIVATION_MARKER_KEY,
} from "../src/storage/localStore.js";

function sharedStorage() {
  const data = new Map();
  let failPrimaryWrite = false;
  return {
    data,
    failNextPrimaryWrite() { failPrimaryWrite = true; },
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) {
      if (key === STORAGE_KEY && failPrimaryWrite) {
        failPrimaryWrite = false;
        throw new Error("QuotaExceededError fictive");
      }
      data.set(key, String(value));
    },
    removeItem(key) { data.delete(key); },
  };
}

function fixtureState() {
  let conversation = { ...createConversation({ title: "Conversation fictive" }), id: "conv-c0-fiction" };
  conversation = addMessage(conversation, createMessage({
    id: "msg-c0-fiction",
    role: "user",
    content: "Contenu privé fictif à ne jamais journaliser.",
  }));
  return {
    ...defaultState(),
    storageRevision: 7,
    conversations: [conversation],
    activeConversationId: conversation.id,
    protocolRuns: [{ id: "run-c0-fiction", status: "draft" }],
    sessionRecords: [{ id: "record-c0-fiction", sourceSessionId: "session-c0-fiction" }],
    memoryEntries: [{ id: "memory-c0-fiction", content: "Mémoire fictive", status: "confirmed" }],
  };
}

describe("SESSION-30-C0 — identité et inventaire", () => {
  it("publie une identité de release compatible uniquement avec le writer v4", () => {
    expect(EQUILIBRE_RELEASE).toEqual({
      releaseId: "equilibre-session30-c0@1.0.0",
      label: "SESSION-30-C0",
      storageSchema: 4,
      minReadableSchema: 1,
      maxWritableSchema: 4,
    });
    expect(Object.isFrozen(EQUILIBRE_RELEASE)).toBe(true);
  });

  it("inventorie comptes et identifiants sans recopier les contenus", () => {
    const inventory = inspectStateInventory(fixtureState());
    expect(inventory).toMatchObject({
      storageVersion: 4,
      storageRevision: 7,
      counts: { conversations: 1, messages: 1, protocolRuns: 1, sessionRecords: 1, memoryEntries: 1 },
      ids: { conversations: ["conv-c0-fiction"], messages: ["msg-c0-fiction"] },
    });
    expect(JSON.stringify(inventory)).not.toContain("Contenu privé fictif");
    expect(JSON.stringify(inventory)).not.toContain("Mémoire fictive");
  });

  it("canonise récursivement les objets sans modifier l’ordre des tableaux", () => {
    expect(canonicalJson({ z: 1, a: { d: 2, b: [3, 1] } })).toBe('{"a":{"b":[3,1],"d":2},"z":1}');
  });
});

describe("SESSION-30-C0 — export portable", () => {
  it("produit un format versionné avec empreinte d’intégrité puis restaure le même état", async () => {
    const state = fixtureState();
    const backup = await createPortableBackup(state, { now: new Date("2026-08-09T18:00:00.000Z") });
    expect(backup).toMatchObject({
      format: PORTABLE_BACKUP_FORMAT,
      formatVersion: PORTABLE_BACKUP_VERSION,
      createdAt: "2026-08-09T18:00:00.000Z",
      source: { releaseId: EQUILIBRE_RELEASE.releaseId, storageSchema: 4, storageRevision: 7 },
      integrity: { algorithm: "SHA-256" },
    });
    expect(backup.integrity.digest).toMatch(/^[0-9a-f]{64}$/);
    const parsed = await parsePortableBackup(JSON.stringify(backup));
    expect(parsed.state.conversations).toEqual(state.conversations);
    expect(parsed.state.protocolRuns).toEqual(state.protocolRuns);
    expect(parsed.inventory).toEqual(inspectStateInventory(state));
  });

  it("ne persiste pas les drapeaux d’erreur runtime", async () => {
    const backup = await createPortableBackup({
      ...fixtureState(),
      storageError: "Erreur fictive",
      writesBlocked: true,
      futureStorageActive: true,
    });
    expect(backup.payload).not.toHaveProperty("storageError");
    expect(backup.payload).not.toHaveProperty("writesBlocked");
    expect(backup.payload).not.toHaveProperty("futureStorageActive");
  });

  it("refuse toute altération du contenu après création", async () => {
    const backup = await createPortableBackup(fixtureState());
    backup.payload.conversations[0].title = "Titre altéré";
    await expect(parsePortableBackup(JSON.stringify(backup))).rejects.toThrow(/modifiée ou endommagée/);
  });

  it("refuse un inventaire falsifié même si son empreinte est absente ou invalide", async () => {
    const backup = await createPortableBackup(fixtureState());
    backup.inventory.counts.messages = 99;
    backup.integrity.digest = "0".repeat(64);
    await expect(parsePortableBackup(JSON.stringify(backup))).rejects.toThrow(/modifiée ou endommagée/);
  });

  it("refuse JSON invalide, format inconnu et fichier trop volumineux", async () => {
    await expect(parsePortableBackup("{cassé")).rejects.toThrow(/JSON valide/);
    await expect(parsePortableBackup(JSON.stringify({ format: "autre", formatVersion: 1 }))).rejects.toThrow(/Version de sauvegarde/);
    await expect(parsePortableBackup("x".repeat(32), { maxBytes: 16 })).rejects.toThrow(/taille autorisée/);
    expect(MAX_PORTABLE_BACKUP_BYTES).toBe(5 * 1024 * 1024);
  });

  it("génère un nom de fichier stable sans caractères interdits iOS", () => {
    expect(portableBackupFilename(new Date("2026-08-09T18:01:02.345Z")))
      .toBe("equilibre-backup-2026-08-09T18-01-02-345Z.json");
  });

  it("préfère la feuille de partage native lorsqu’elle accepte les fichiers", async () => {
    const shared = [];
    class FakeFile {
      constructor(parts, name, options) { Object.assign(this, { parts, name, type: options.type }); }
    }
    const runtime = {
      File: FakeFile,
      navigator: {
        canShare: ({ files }) => files[0].name === "backup.json",
        share: async (payload) => shared.push(payload),
      },
    };

    await expect(deliverPortableBackup("{}", "backup.json", runtime)).resolves.toBe("shared");
    expect(shared).toHaveLength(1);
    expect(shared[0].files[0]).toMatchObject({ name: "backup.json", type: "application/json" });
  });

  it("retombe sur un téléchargement local lorsque le partage de fichiers est absent", async () => {
    const events = [];
    const anchor = {
      click: () => events.push("click"),
      remove: () => events.push("remove"),
    };
    const runtime = {
      Blob: class FakeBlob {},
      navigator: {},
      URL: {
        createObjectURL: () => "blob:fixture",
        revokeObjectURL: (url) => events.push(`revoke:${url}`),
      },
      document: {
        createElement: () => anchor,
        body: { append: () => events.push("append") },
      },
      setTimeout: (callback) => callback(),
    };

    await expect(deliverPortableBackup("{}", "backup.json", runtime)).resolves.toBe("downloaded");
    expect(anchor).toMatchObject({ href: "blob:fixture", download: "backup.json", hidden: true });
    expect(events).toEqual(["append", "click", "remove", "revoke:blob:fixture"]);
  });
});

describe("SESSION-30-C0 — restauration contrôlée v4", () => {
  it("sauvegarde l’état courant avant remplacement et augmente la révision", async () => {
    const storage = sharedStorage();
    const store = createStore(storage);
    const original = fixtureState();
    expect(store.save(original)).toBe(true);
    const backup = await createPortableBackup(original);
    const parsed = await parsePortableBackup(JSON.stringify(backup));

    const current = { ...store.load(), conversations: [] };
    expect(store.save(current)).toBe(true);
    const beforeRestore = storage.getItem(STORAGE_KEY);
    expect(store.restore(parsed.state)).toBe(true);

    expect(storage.getItem(V4_RESTORE_BACKUP_KEY)).toBe(beforeRestore);
    const restored = store.load();
    expect(restored.conversations[0].id).toBe("conv-c0-fiction");
    expect(restored.storageRevision).toBeGreaterThan(parsed.state.storageRevision);
    expect(restored.settings.saveLocally).toBe(true);
  });

  it("conserve l’état courant si l’écriture restaurée échoue", async () => {
    const storage = sharedStorage();
    const store = createStore(storage);
    expect(store.save(fixtureState())).toBe(true);
    const current = storage.getItem(STORAGE_KEY);
    const parsed = await parsePortableBackup(JSON.stringify(await createPortableBackup(defaultState())));
    storage.failNextPrimaryWrite();

    expect(store.restore(parsed.state)).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(current);
    expect(storage.getItem(V4_RESTORE_BACKUP_KEY)).toBe(current);
  });

  it("refuse une restauration depuis un runtime devenu obsolète", async () => {
    const storage = sharedStorage();
    const first = createStore(storage);
    const stale = createStore(storage);
    first.load();
    stale.load();
    expect(first.save(fixtureState())).toBe(true);

    const current = storage.getItem(STORAGE_KEY);
    expect(stale.restore(defaultState())).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(current);
    expect(storage.getItem(V4_RESTORE_BACKUP_KEY)).toBeNull();
  });

  it("clear supprime aussi le snapshot de restauration", () => {
    const storage = sharedStorage();
    const store = createStore(storage);
    store.save(fixtureState());
    for (const key of BACKUP_KEYS) storage.setItem(key, `backup-${key}`);
    expect(store.clear()).toBe(true);
    expect(BACKUP_KEYS).toHaveLength(5);
    for (const key of BACKUP_KEYS) expect(storage.getItem(key)).toBeNull();
  });
});

describe("SESSION-30-C0 — verrou d’écriture v5", () => {
  it("conserve la v4 lisible mais bloque save, restore et clear après activation v5", () => {
    const storage = sharedStorage();
    const raw = JSON.stringify(fixtureState());
    storage.setItem(STORAGE_KEY, raw);
    storage.setItem(V5_ACTIVATION_MARKER_KEY, JSON.stringify({ storageSchema: 5 }));
    const store = createStore(storage);

    const loaded = store.load();
    expect(loaded.conversations[0].id).toBe("conv-c0-fiction");
    expect(loaded).toMatchObject({ writesBlocked: true, futureStorageActive: true });
    expect(loaded.storageError).toContain("lecture seule");
    expect(store.save(defaultState())).toBe(false);
    expect(store.restore(defaultState())).toBe(false);
    expect(store.clear()).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    expect(storage.getItem(V5_ACTIVATION_MARKER_KEY)).not.toBeNull();
  });

  it("ne matérialise aucune migration legacy lorsque le marqueur v5 est déjà actif", () => {
    const storage = sharedStorage();
    const rawV3 = JSON.stringify({ ...fixtureState(), version: 3, storageRevision: undefined, protocolRuns: undefined });
    storage.setItem(STORAGE_KEY, rawV3);
    storage.setItem(V5_ACTIVATION_MARKER_KEY, "active");

    const loaded = createStore(storage).load();
    expect(loaded.version).toBe(4);
    expect(loaded.futureStorageActive).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe(rawV3);
  });
});
