import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ArchiveService } from "../src/archive-service.js";

test("reports explicit blockers until every referenced attachment is Drive verified", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "archive-service-"));
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("attachment");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(rootDir, { recursive: true, force: true });
  });
  const port = server.address().port;
  const service = new ArchiveService({ rootDir, collectorOptions: { retryBaseMs: 1 } });
  await service.startSession({ sessionId: "SES-20260807-003", source: "chatgpt" });
  await service.appendEvents({ sessionId: "SES-20260807-003", events: [
    { role: "assistant", content: "Voici le fichier", attachmentSourceIds: ["codex-output-1"] }
  ] });
  await service.captureAttachment({ sourceId: "codex-output-1", url: `http://127.0.0.1:${port}/temporary` });
  await service.finalizeSession({ sessionId: "SES-20260807-003" });
  const pending = await service.status("SES-20260807-003");
  assert.equal(pending.complete, false);
  assert.deepEqual(pending.blockers, [{ sourceId: "codex-output-1", status: "buffered" }]);
  await service.markReplica("codex-output-1", "drive_verified");
  const complete = await service.status("SES-20260807-003");
  assert.equal(complete.complete, true);
  assert.equal(complete.status, "complete");
});

test("never calls a session complete when a referenced file was not detected", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "archive-service-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const service = new ArchiveService({ rootDir });
  await service.startSession({ sessionId: "SES-20260807-004", source: "codex" });
  await service.appendEvents({ sessionId: "SES-20260807-004", events: [
    { role: "user", content: "Pièce jointe", attachmentSourceIds: ["missing-1"] }
  ] });
  await service.finalizeSession({ sessionId: "SES-20260807-004" });
  const status = await service.status("SES-20260807-004");
  assert.deepEqual(status.blockers, [{ sourceId: "missing-1", status: "not_detected" }]);
});
