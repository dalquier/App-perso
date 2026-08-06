import { openDB } from "idb";
import type { CodexConversation } from "../domain/codexConversation";
import { DB_VERSION } from "./indexedDbRepository";
const STORE = "codexConversations";
export interface CodexRepository {
  list(): Promise<CodexConversation[]>; get(id: string): Promise<CodexConversation | undefined>;
  save(value: CodexConversation): Promise<CodexConversation>; delete(id: string): Promise<void>;
  merge(values: CodexConversation[]): Promise<void>;
}
export class IndexedDbCodexRepository implements CodexRepository {
  private db;
  constructor(name = "developeros") {
    this.db = openDB(name, DB_VERSION, { upgrade(db) {
      if (!db.objectStoreNames.contains("projects")) { const projects = db.createObjectStore("projects", { keyPath: "id" }); projects.createIndex("updatedAt", "updatedAt"); }
      if (!db.objectStoreNames.contains(STORE)) { const store = db.createObjectStore(STORE, { keyPath: "id" }); store.createIndex("updatedAt", "updatedAt"); store.createIndex("status", "status"); }
    }});
  }
  async list() { return ((await (await this.db).getAll(STORE)) as CodexConversation[]).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async get(id: string) { return (await (await this.db).get(STORE, id)) as CodexConversation | undefined; }
  async save(value: CodexConversation) { await (await this.db).put(STORE, value); return value; }
  async delete(id: string) { await (await this.db).delete(STORE, id); }
  async merge(values: CodexConversation[]) { const tx = (await this.db).transaction(STORE, "readwrite"); for (const value of values) await tx.store.put(value); await tx.done; }
}
export const codexRepository = new IndexedDbCodexRepository();
