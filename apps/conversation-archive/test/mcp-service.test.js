import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ArchiveMcpService } from "../src/mcp-service.js";
import { createMcpHandler } from "../src/mcp-protocol.js";
import { FileCollector } from "../src/collector.js";

async function fixture(t, options = {}) {
  const rootDir = await mkdtemp(join(tmpdir(), "archive-mcp-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const collector = new FileCollector({ rootDir, fetchImpl: options.fetchImpl || (() => { throw new Error("unexpected fetch"); }), retryBaseMs: 0 });
  return { rootDir, service: new ArchiveMcpService({ rootDir, collector, urlResolver: options.urlResolver }) };
}

test("lists exactly the five tool-only operations", async (t) => {
  const { service } = await fixture(t);
  assert.deepEqual(service.listTools().map(({ name }) => name), ["start_session", "append_events", "capture_attachment", "finalize_session", "status"]);
});

test("runs the session lifecycle and reports status", async (t) => {
  const { service } = await fixture(t);
  await service.callTool("start_session", { session_id: "SES-001", source: "codex", title: "Test" });
  assert.deepEqual(await service.callTool("append_events", { session_id: "SES-001", events: [
    { event_id: "evt-1", role: "user", content: "hello", attachment_file_ids: ["file-1"] }
  ] }), { inserted: 1, total: 1 });
  await service.callTool("finalize_session", { session_id: "SES-001" });
  const status = await service.callTool("status", { session_id: "SES-001", file_ids: ["absent"] });
  assert.equal(status.session.status, "ready_for_replication");
  assert.equal(status.session.eventCount, 1);
  assert.equal(status.attachments.absent, null);
});

test("captures from an injected fetch and renews an expired URL by file_id", async (t) => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url.toString());
    return url.pathname === "/expired"
      ? new Response("expired", { status: 403 })
      : new Response("offline fixture", { status: 200, headers: { "content-type": "text/plain" } });
  };
  let renewal;
  const urlResolver = { renew: async (request) => {
    renewal = request;
    return "https://fixture.invalid/fresh";
  } };
  const { service } = await fixture(t, { fetchImpl, urlResolver });
  const output = await service.callTool("capture_attachment", {
    file_id: "file-123", download_url: "https://fixture.invalid/expired", filename: "note.txt"
  });
  assert.equal(output.status, "buffered");
  assert.equal(renewal.fileId, "file-123");
  assert.equal(calls.length, 2);
  assert.equal(await readFile(output.localPath, "utf8"), "offline fixture");
  const status = await service.callTool("status", { file_ids: ["file-123"] });
  assert.equal(status.attachments["file-123"].status, "buffered");
});

test("speaks MCP initialize, tools/list and tools/call JSON-RPC", async (t) => {
  const { service } = await fixture(t);
  const handle = createMcpHandler(service);
  const initialized = await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert.equal(initialized.result.serverInfo.name, "conversation-archive");
  const listed = await handle({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.equal(listed.result.tools.length, 5);
  const called = await handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: {
    name: "start_session", arguments: { session_id: "SES-002", source: "chatgpt" }
  } });
  assert.equal(called.result.isError, false);
  assert.equal(called.result.structuredContent.sessionId, "SES-002");
});

test("returns tool errors as MCP tool results", async (t) => {
  const { service } = await fixture(t);
  const handle = createMcpHandler(service);
  const response = await handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "nope" } });
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /Unknown tool/);
});
