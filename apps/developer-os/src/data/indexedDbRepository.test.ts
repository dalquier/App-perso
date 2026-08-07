import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { createProject, emptyDraft, type Project } from "../domain/project";
import { IndexedDbProjectRepository } from "./indexedDbRepository";
import { openDB } from "idb";

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
    const req = indexedDB.open(names.at(-1)!, 2);
    const opened = await new Promise<IDBDatabase>((resolve, reject) => {
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => undefined;
      req.onsuccess = () => resolve(req.result);
    });
    opened.close();
    expect(opened.version).toBe(2);
  });

  it("normalizes legacy projects without changing DB v2 or deleting Codex conversations", async () => {
    const name = `test-${crypto.randomUUID()}`; names.push(name);
    const db = await openDB(name, 2, { upgrade(database) { database.createObjectStore("projects", { keyPath: "id" }); database.createObjectStore("codexConversations", { keyPath: "id" }); } });
    const legacy = createProject({ ...emptyDraft(), name: "Legacy" });
    const oldProject = { ...legacy } as Project & Record<string, unknown>;
    delete oldProject.resumeText; delete oldProject.resumeHistory; delete oldProject.references; delete oldProject.resumeUpdatedAt;
    await db.put("projects", oldProject); await db.put("codexConversations", { id: "codex-1", updatedAt: legacy.updatedAt }); db.close();
    const repo = new IndexedDbProjectRepository(name);
    expect(await repo.get(legacy.id)).toMatchObject({ resumeText: "", resumeHistory: [], references: [] });
    await repo.replaceAll([{ ...legacy, name: "Importé" }]);
    const check = await openDB(name, 2);
    expect(await check.get("codexConversations", "codex-1")).toBeTruthy(); check.close();
  });
});
