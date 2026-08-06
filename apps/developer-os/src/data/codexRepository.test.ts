import { openDB } from "idb";
import { describe, expect, it } from "vitest";
import type { CodexConversation } from "../domain/codexConversation";
import { IndexedDbCodexRepository } from "./codexRepository";

const conversation: CodexConversation = {
  id: "conversation-test",
  name: "Conversation factice",
  status: "draft",
  prompt: "Prompt de test sans donnée réelle",
  conversationUrl: null,
  projectId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  launchedAt: null,
};

describe("IndexedDbCodexRepository", () => {
  it("enregistre, trie et supprime", async () => {
    const name = `codex-${crypto.randomUUID()}`;
    const repository = new IndexedDbCodexRepository(name);
    await repository.save(conversation);
    expect(await repository.get(conversation.id)).toEqual(conversation);

    await repository.save({
      ...conversation,
      id: "later",
      updatedAt: "2027-01-01T00:00:00Z",
    });
    expect((await repository.list())[0].id).toBe("later");

    await repository.delete(conversation.id);
    expect(await repository.get(conversation.id)).toBeUndefined();
  });

  it("fusionne sans écraser une version locale plus récente", async () => {
    const repository = new IndexedDbCodexRepository(
      `merge-${crypto.randomUUID()}`,
    );
    await repository.save({
      ...conversation,
      name: "Version locale récente",
      updatedAt: "2027-01-01T00:00:00Z",
    });

    const result = await repository.merge([
      { ...conversation, name: "Version ancienne" },
      {
        ...conversation,
        id: "new-entry",
        updatedAt: "2028-01-01T00:00:00Z",
      },
    ]);

    expect(result).toEqual({ added: 1, updated: 0, skipped: 1 });
    expect((await repository.get(conversation.id))?.name).toBe(
      "Version locale récente",
    );
  });

  it("remplace une version locale uniquement si l’import est plus récent", async () => {
    const repository = new IndexedDbCodexRepository(
      `merge-newer-${crypto.randomUUID()}`,
    );
    await repository.save(conversation);

    const result = await repository.merge([
      {
        ...conversation,
        name: "Version importée récente",
        updatedAt: "2027-01-01T00:00:00Z",
      },
    ]);

    expect(result).toEqual({ added: 0, updated: 1, skipped: 0 });
    expect((await repository.get(conversation.id))?.name).toBe(
      "Version importée récente",
    );
  });

  it("migre la version 1 sans perdre les projets", async () => {
    const name = `migration-${crypto.randomUUID()}`;
    const oldDatabase = await openDB(name, 1, {
      upgrade(database) {
        database
          .createObjectStore("projects", { keyPath: "id" })
          .put({ id: "project-preserved", updatedAt: "2026-01-01" });
      },
    });
    oldDatabase.close();

    const repository = new IndexedDbCodexRepository(name);
    await repository.list();

    const upgraded = await openDB(name, 2);
    expect(await upgraded.get("projects", "project-preserved")).toMatchObject({
      id: "project-preserved",
    });
    expect(upgraded.objectStoreNames.contains("codexConversations")).toBe(true);
    const transaction = upgraded.transaction("codexConversations");
    expect(Array.from(transaction.store.indexNames)).toEqual(
      expect.arrayContaining(["updatedAt", "status"]),
    );
    upgraded.close();
  });
});
