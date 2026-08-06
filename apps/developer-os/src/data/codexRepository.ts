import { openDB, type IDBPDatabase } from "idb";
import type { CodexConversation } from "../domain/codexConversation";
import { DB_VERSION } from "./indexedDbRepository";

const STORE = "codexConversations";

type DeveloperOsDb = IDBPDatabase<unknown>;

export type CodexMergeResult = {
  added: number;
  updated: number;
  skipped: number;
};

export interface CodexRepository {
  list(): Promise<CodexConversation[]>;
  get(id: string): Promise<CodexConversation | undefined>;
  save(value: CodexConversation): Promise<CodexConversation>;
  delete(id: string): Promise<void>;
  merge(values: CodexConversation[]): Promise<CodexMergeResult>;
}

export class IndexedDbCodexRepository implements CodexRepository {
  private db: Promise<DeveloperOsDb>;

  constructor(name = "developeros") {
    this.db = openDB(name, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          const projects = db.createObjectStore("projects", { keyPath: "id" });
          projects.createIndex("updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("status", "status");
        }
      },
    });
  }

  async list(): Promise<CodexConversation[]> {
    const values = (await (await this.db).getAll(STORE)) as CodexConversation[];
    return values.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<CodexConversation | undefined> {
    return (await (await this.db).get(STORE, id)) as
      | CodexConversation
      | undefined;
  }

  async save(value: CodexConversation): Promise<CodexConversation> {
    await (await this.db).put(STORE, value);
    return value;
  }

  async delete(id: string): Promise<void> {
    await (await this.db).delete(STORE, id);
  }

  async merge(values: CodexConversation[]): Promise<CodexMergeResult> {
    const tx = (await this.db).transaction(STORE, "readwrite");
    const result: CodexMergeResult = { added: 0, updated: 0, skipped: 0 };

    for (const value of values) {
      const current = (await tx.store.get(value.id)) as
        | CodexConversation
        | undefined;
      if (!current) {
        await tx.store.put(value);
        result.added += 1;
      } else if (value.updatedAt > current.updatedAt) {
        await tx.store.put(value);
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    }

    await tx.done;
    return result;
  }
}

export const codexRepository = new IndexedDbCodexRepository();
