import { openDB, type IDBPDatabase } from "idb";
import type { Project } from "../domain/project";
import {
  DB_VERSION,
  ensureDeveloperOsStores,
  PROJECTS_STORE,
} from "./indexedDbSchema";
import {
  RepositoryUnavailableError,
  type ProjectRepository,
} from "./repository";

export { DB_VERSION } from "./indexedDbSchema";

const STORE = PROJECTS_STORE;

type DeveloperOsDb = IDBPDatabase<unknown>;

export class IndexedDbProjectRepository implements ProjectRepository {
  private db: Promise<DeveloperOsDb>;

  constructor(name = "developeros") {
    this.db = openDB(name, DB_VERSION, {
      upgrade(db) {
        ensureDeveloperOsStores(db);
      },
      blocked() {
        throw new RepositoryUnavailableError(
          "IndexedDB est bloquée par un autre onglet. Fermez les autres fenêtres DeveloperOS puis réessayez.",
          "blocked",
        );
      },
      blocking(_currentVersion, _blockedVersion, event) {
        const db =
          event.target instanceof IDBOpenDBRequest
            ? event.target.result
            : undefined;
        db?.close();
      },
    })
      .then((db) => {
        db.onversionchange = () => {
          db.close();
        };
        return db;
      })
      .catch((error: unknown) => {
        if (error instanceof RepositoryUnavailableError) throw error;
        throw new RepositoryUnavailableError(
          "IndexedDB est indisponible pour le moment.",
          "open_failed",
        );
      });
  }

  async list(): Promise<Project[]> {
    const db = await this.db;
    const projects = (await db.getAll(STORE)) as Project[];
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Project | undefined> {
    const db = await this.db;
    return (await db.get(STORE, id)) as Project | undefined;
  }

  async save(project: Project): Promise<Project> {
    const db = await this.db;
    const tx = db.transaction(STORE, "readwrite");

    if (project.isActive) {
      const projects = (await tx.store.getAll()) as Project[];
      for (const other of projects) {
        if (other.id !== project.id && other.isActive) {
          await tx.store.put({
            ...other,
            isActive: false,
            updatedAt: project.updatedAt,
          });
        }
      }
    }

    await tx.store.put(project);
    await tx.done;
    return project;
  }

  async replaceAll(projects: Project[]): Promise<void> {
    for (const project of projects) {
      if (!project.id) throw new Error("Projet importé sans identifiant.");
    }
    const db = await this.db;
    const tx = db.transaction(STORE, "readwrite");
    await tx.store.clear();
    for (const project of projects) await tx.store.put(project);
    await tx.done;
  }

  async clear(): Promise<void> {
    const db = await this.db;
    await db.clear(STORE);
  }
}

export const repository = new IndexedDbProjectRepository();
