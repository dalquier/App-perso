import { openDB, type IDBPDatabase } from "idb";
import { RunRepositoryError, type PersistedRun, type RunRepository } from "../domain/conversationOrchestrator";

export const DEVELOPER_OS_DB_VERSION = 2;
export const PROJECTS_STORE = "projects";
export const CONVERSATION_RUNS_STORE = "conversation-runs";

type DeveloperOsDb = IDBPDatabase<unknown>;
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deepFreeze); }
  return value;
};
const hydrate = (run: PersistedRun): PersistedRun => { const copy = structuredClone(run); deepFreeze(copy.plan); return copy; };

export class IndexedDbRunRepository implements RunRepository {
  private readonly db: Promise<DeveloperOsDb>;

  constructor(name = "developeros") {
    this.db = openDB(name, DEVELOPER_OS_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projects = db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
          projects.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(CONVERSATION_RUNS_STORE)) {
          const runs = db.createObjectStore(CONVERSATION_RUNS_STORE, { keyPath: "run_id" });
          runs.createIndex("updated_at", "updated_at");
        }
      },
      blocking(_currentVersion, _blockedVersion, event) {
        if (event.target instanceof IDBOpenDBRequest) event.target.result.close();
      },
    }).then((db) => { db.onversionchange = () => db.close(); return db; }).catch((cause: unknown) => {
      throw new RunRepositoryError("IndexedDB is unavailable.", "unavailable", cause);
    });
  }

  async list(): Promise<PersistedRun[]> {
    const db = await this.db;
    return ((await db.getAll(CONVERSATION_RUNS_STORE)) as PersistedRun[]).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).map(hydrate);
  }
  async get(runId: string): Promise<PersistedRun | undefined> {
    const db = await this.db; const run = await db.get(CONVERSATION_RUNS_STORE, runId) as PersistedRun | undefined;
    return run ? hydrate(run) : undefined;
  }
  async create(run: PersistedRun): Promise<void> { await this.insertWithoutOverwrite(run); }
  async importRun(run: PersistedRun): Promise<void> { await this.insertWithoutOverwrite(run); }
  private async insertWithoutOverwrite(run: PersistedRun): Promise<void> {
    const db = await this.db; const tx = db.transaction(CONVERSATION_RUNS_STORE, "readwrite");
    if (await tx.store.get(run.run_id)) { await tx.done; throw new RunRepositoryError(`Run ${run.run_id} already exists.`, "conflict"); }
    await tx.store.add(structuredClone(run)); await tx.done;
  }
  async update(runId: string, update: (current: PersistedRun) => PersistedRun): Promise<PersistedRun> {
    const db = await this.db; const tx = db.transaction(CONVERSATION_RUNS_STORE, "readwrite");
    const current = await tx.store.get(runId) as PersistedRun | undefined;
    if (!current) { await tx.done; throw new RunRepositoryError(`Run ${runId} was not found.`, "not_found"); }
    const next = update(structuredClone(current));
    if (next.run_id !== runId) { await tx.done; throw new RunRepositoryError("A run identifier cannot be changed.", "invalid_data"); }
    await tx.store.put(structuredClone(next)); await tx.done; return hydrate(next);
  }
  async delete(runId: string, confirmation: { confirmed: true }): Promise<void> {
    if (confirmation?.confirmed !== true) throw new RunRepositoryError("Explicit deletion confirmation is required.", "invalid_data");
    const db = await this.db; const tx = db.transaction(CONVERSATION_RUNS_STORE, "readwrite");
    if (!(await tx.store.get(runId))) { await tx.done; throw new RunRepositoryError(`Run ${runId} was not found.`, "not_found"); }
    await tx.store.delete(runId); await tx.done;
  }
}
