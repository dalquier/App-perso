import "fake-indexeddb/auto";
import { openDB } from "idb";
import { afterEach, describe, expect, it } from "vitest";
import { createProject, emptyDraft, type Project } from "../domain/project";
import {
  DB_VERSION,
  IndexedDbProjectRepository,
} from "./indexedDbRepository";
import {
  CODEX_CONVERSATIONS_STORE,
  CONVERSATION_RUNS_STORE,
  PROJECTS_STORE,
} from "./indexedDbSchema";

const names: string[] = [];

const make = () => {
  const name = `test-${crypto.randomUUID()}`;
  names.push(name);
  return new IndexedDbProjectRepository(name);
};

afterEach(async () => {
  for (const name of names.splice(0)) indexedDB.deleteDatabase(name);
});

describe("IndexedDB repository", () => {
  it("persists and retrieves a project", async () => {
    const repo = make();
    const project = createProject({ ...emptyDraft(), name: "Persisté" });
    await repo.save(project);
    expect(await repo.get(project.id)).toEqual(project);
  });

  it("enforces one active project atomically", async () => {
    const repo = make();
    const first = createProject({ ...emptyDraft(), name: "A", isActive: true });
    const second = createProject({
      ...emptyDraft(),
      name: "B",
      isActive: true,
    });
    await repo.save(first);
    await repo.save(second);
    const all = await repo.list();
    expect(
      all.filter((project) => project.isActive).map((project) => project.id),
    ).toEqual([second.id]);
  });

  it("archives an active project atomically without activating another project", async () => {
    const repo = make();
    const active = createProject({ ...emptyDraft(), name: "Active", isActive: true });
    const paused = createProject({ ...emptyDraft(), name: "Paused", status: "paused" });
    await repo.save(active);
    await repo.save(paused);

    await repo.save({
      ...active,
      status: "archived",
      isActive: false,
      updatedAt: "2026-08-05T00:00:00.000Z",
    });

    const all = await repo.list();
    expect(all.find((project) => project.id === active.id)).toEqual(
      expect.objectContaining({ status: "archived", isActive: false }),
    );
    expect(all.every((project) => !project.isActive)).toBe(true);
  });

  it("restores an archived project as paused and inactive while preserving data", async () => {
    const repo = make();
    const archived = createProject({
      ...emptyDraft(),
      name: "Archive",
      status: "archived",
      lastKnownState: "Toutes les données",
    });
    await repo.save(archived);

    await repo.save({
      ...archived,
      status: "paused",
      isActive: false,
      updatedAt: "2026-08-05T00:00:00.000Z",
    });

    expect(await repo.get(archived.id)).toEqual({
      ...archived,
      status: "paused",
      isActive: false,
      updatedAt: "2026-08-05T00:00:00.000Z",
    });
  });

  it("replaces all projects inside one transaction and clears explicitly", async () => {
    const repo = make();
    const project = createProject({ ...emptyDraft(), name: "Import" });
    await repo.replaceAll([project]);
    expect(await repo.list()).toHaveLength(1);
    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });

  it("keeps old data when replacement fails before commit", async () => {
    const repo = make();
    const project = createProject({ ...emptyDraft(), name: "Safe" });
    await repo.replaceAll([project]);
    await expect(
      repo.replaceAll([{ ...project, id: undefined as unknown as string }]),
    ).rejects.toThrow();
    expect(await repo.list()).toEqual([project]);
  });

  it("closes obsolete connections on version change", async () => {
    const repo = make();
    await repo.list();
    const nextVersion = DB_VERSION + 1;
    const req = indexedDB.open(names.at(-1)!, nextVersion);
    const opened = await new Promise<IDBDatabase>((resolve, reject) => {
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => undefined;
      req.onsuccess = () => resolve(req.result);
    });
    opened.close();
    expect(opened.version).toBe(nextVersion);
  });

  it("migrates legacy v2 projects to v3 and preserves Codex conversations and conversation runs across project replacement", async () => {
    const name = `test-${crypto.randomUUID()}`;
    names.push(name);
    const legacyDb = await openDB(name, 2, {
      upgrade(database) {
        database.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
        database.createObjectStore(CODEX_CONVERSATIONS_STORE, { keyPath: "id" });
      },
    });
    const legacy = createProject({ ...emptyDraft(), name: "Legacy" });
    const oldProject = { ...legacy } as Project & Record<string, unknown>;
    delete oldProject.resumeText;
    delete oldProject.resumeUpdatedAt;
    delete oldProject.resumeHistory;
    delete oldProject.references;
    await legacyDb.put(PROJECTS_STORE, oldProject);
    await legacyDb.put(CODEX_CONVERSATIONS_STORE, {
      id: "codex-1",
      updatedAt: legacy.updatedAt,
      status: "draft",
    });
    legacyDb.close();

    const repo = new IndexedDbProjectRepository(name);
    expect(await repo.get(legacy.id)).toMatchObject({
      id: legacy.id,
      resumeText: "",
      resumeUpdatedAt: null,
      resumeHistory: [],
      references: [],
    });

    const migratedDb = await openDB(name, DB_VERSION);
    expect(Array.from(migratedDb.objectStoreNames)).toEqual(
      expect.arrayContaining([
        PROJECTS_STORE,
        CODEX_CONVERSATIONS_STORE,
        CONVERSATION_RUNS_STORE,
      ]),
    );
    expect(await migratedDb.get(CODEX_CONVERSATIONS_STORE, "codex-1")).toBeTruthy();
    await migratedDb.put(CONVERSATION_RUNS_STORE, {
      run_id: "run-1",
      updated_at: "2026-08-07T10:00:00.000Z",
    });
    migratedDb.close();

    await repo.replaceAll([
      createProject({ ...emptyDraft(), name: "Replacement" }),
    ]);

    const verifiedDb = await openDB(name, DB_VERSION);
    expect(await verifiedDb.get(CODEX_CONVERSATIONS_STORE, "codex-1")).toBeTruthy();
    expect(await verifiedDb.get(CONVERSATION_RUNS_STORE, "run-1")).toBeTruthy();
    verifiedDb.close();
  });
});
