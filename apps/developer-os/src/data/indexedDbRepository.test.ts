import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { createProject, emptyDraft } from "../domain/project";
import { IndexedDbProjectRepository } from "./indexedDbRepository";

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
});
