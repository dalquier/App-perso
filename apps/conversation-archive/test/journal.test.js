import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ConversationJournal } from "../src/journal.js";

test("captures every exchange in order and ignores duplicate event ids", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "archive-journal-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const journal = new ConversationJournal({ rootDir });
  await journal.start({ sessionId: "SES-20260807-001", source: "chatgpt" });
  const result = await journal.append({
    sessionId: "SES-20260807-001",
    events: [
      { eventId: "evt-1", role: "user", content: "Bonjour", attachmentSourceIds: ["file-1"] },
      { eventId: "evt-2", role: "assistant", content: "Réponse", attachmentSourceIds: ["file-2"] },
      { eventId: "evt-1", role: "user", content: "doublon" }
    ]
  });
  assert.deepEqual(result, { inserted: 2, total: 2 });
  const events = JSON.parse(await readFile(journal.pathsFor("SES-20260807-001").eventsPath));
  assert.deepEqual(events.map((event) => event.role), ["user", "assistant"]);
  assert.deepEqual(events.map((event) => event.sequence), [1, 2]);
});

test("finalization is idempotent and never starts the retention clock", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "archive-journal-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const journal = new ConversationJournal({ rootDir });
  await journal.start({ sessionId: "SES-20260807-002", source: "codex" });
  const first = await journal.finalize({ sessionId: "SES-20260807-002" });
  const second = await journal.finalize({ sessionId: "SES-20260807-002" });
  assert.equal(first.finalizedAt, second.finalizedAt);
  assert.equal(second.retention.startsAt, "drive_verified_at");
  assert.equal("driveVerifiedAt" in second, false);
});
