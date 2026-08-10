import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { FileCollector } from "../src/collector.js";

async function fixture(t, handler, options = {}) {
  const rootDir = await mkdtemp(join(tmpdir(), "collector-spike-"));
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(rootDir, { recursive: true, force: true });
  });
  return {
    rootDir,
    baseUrl: `http://127.0.0.1:${port}`,
    collector: new FileCollector({ rootDir, retryBaseMs: 1, ...options })
  };
}

test("streams a temporary URL, sanitizes its name, hashes it and writes atomically", async (t) => {
  const body = Buffer.from("ProjectOS attachment");
  const { collector, baseUrl } = await fixture(t, (_request, response) => {
    response.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": "attachment; filename=ignored.txt"
    });
    response.end(body);
  });
  const result = await collector.collect({
    sourceId: "file-001",
    url: `${baseUrl}/temporary-token`,
    originalName: "../unsafe:name.txt",
    expectedMime: "text/plain"
  });
  assert.equal(result.status, "buffered");
  assert.equal(result.filename, "unsafe_name.txt");
  assert.equal(result.sha256, createHash("sha256").update(body).digest("hex"));
  assert.deepEqual(await readFile(result.localPath), body);
  assert.equal((await readdir(join(collector.rootDir, "records/file-001/payload"))).some((x) => x.endsWith(".part")), false);
});

test("follows bounded redirects", async (t) => {
  const { collector, baseUrl } = await fixture(t, (request, response) => {
    const step = Number(request.url.slice(1) || 0);
    if (step < 2) {
      response.writeHead(302, { location: `/${step + 1}` });
      response.end();
    } else {
      response.writeHead(200, { "content-type": "application/octet-stream" });
      response.end("ok");
    }
  }, { maxRedirects: 2 });
  const result = await collector.collect({ sourceId: "redirect-ok", url: `${baseUrl}/0` });
  assert.equal(result.finalUrl, `${baseUrl}/2`);
});

test("rejects too many redirects", async (t) => {
  const { collector, baseUrl } = await fixture(t, (request, response) => {
    const step = Number(request.url.slice(1) || 0);
    response.writeHead(302, { location: `/${step + 1}` });
    response.end();
  }, { maxRedirects: 1 });
  await assert.rejects(
    collector.collect({ sourceId: "redirect-fail", url: `${baseUrl}/0` }),
    { code: "TOO_MANY_REDIRECTS" }
  );
});

test("enforces streamed size limit and removes partial bytes", async (t) => {
  const { collector, baseUrl, rootDir } = await fixture(t, (_request, response) => {
    response.writeHead(200, { "content-type": "application/octet-stream" });
    response.write(Buffer.alloc(8));
    response.end(Buffer.alloc(8));
  });
  await assert.rejects(
    collector.collect({ sourceId: "too-large", url: baseUrl, maxBytes: 10 }),
    { code: "SIZE_LIMIT" }
  );
  const payloads = await readdir(join(rootDir, "records/too-large/payload")).catch(() => []);
  assert.deepEqual(payloads, []);
});

test("validates MIME type", async (t) => {
  const { collector, baseUrl } = await fixture(t, (_request, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end("not a pdf");
  });
  await assert.rejects(
    collector.collect({ sourceId: "mime", url: baseUrl, expectedMime: "application/pdf" }),
    { code: "MIME_MISMATCH" }
  );
});

test("retries transient HTTP failures", async (t) => {
  let requests = 0;
  const { collector, baseUrl } = await fixture(t, (_request, response) => {
    requests += 1;
    if (requests < 3) {
      response.writeHead(503);
      response.end("later");
    } else {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("ready");
    }
  });
  const result = await collector.collect({ sourceId: "retry", url: baseUrl });
  assert.equal(result.attempts, 3);
  assert.equal(requests, 3);
});

test("retries a raw network disconnect", async (t) => {
  let requests = 0;
  const { collector, baseUrl } = await fixture(t, (request, response) => {
    requests += 1;
    if (requests === 1) {
      request.socket.destroy();
      return;
    }
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("recovered");
  });
  const result = await collector.collect({ sourceId: "network-retry", url: baseUrl });
  assert.equal(requests, 2);
  assert.equal(await readFile(result.localPath, "utf8"), "recovered");
});

test("refreshes an expired temporary URL once", async (t) => {
  let refreshCalls = 0;
  const { collector, baseUrl } = await fixture(t, (request, response) => {
    if (request.url === "/expired") {
      response.writeHead(403);
      response.end("expired");
    } else {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("renewed");
    }
  });
  const result = await collector.collect({
    sourceId: "refresh",
    url: `${baseUrl}/expired`,
    refreshUrl: async () => {
      refreshCalls += 1;
      return `${baseUrl}/renewed`;
    }
  });
  assert.equal(refreshCalls, 1);
  assert.equal(await readFile(result.localPath, "utf8"), "renewed");
});

test("returns an idempotent hit without downloading twice", async (t) => {
  let requests = 0;
  const { collector, baseUrl } = await fixture(t, (_request, response) => {
    requests += 1;
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("same");
  });
  await collector.collect({ sourceId: "stable-id", url: `${baseUrl}/first-token` });
  const result = await collector.collect({ sourceId: "stable-id", url: `${baseUrl}/second-token` });
  assert.equal(result.idempotentHit, true);
  assert.equal(requests, 1);
});

test("times out and retries without retaining partial bytes", async (t) => {
  const { collector, baseUrl, rootDir } = await fixture(t, (_request, response) => {
    response.writeHead(200, { "content-type": "application/octet-stream" });
    response.write("partial");
    setTimeout(() => response.end("late"), 100);
  }, { timeoutMs: 10, maxAttempts: 2 });
  await assert.rejects(
    collector.collect({ sourceId: "timeout", url: baseUrl }),
    { code: "TIMEOUT" }
  );
  const payloads = await readdir(join(rootDir, "records/timeout/payload")).catch(() => []);
  assert.deepEqual(payloads, []);
});

test("purges only drive-verified records older than 30 days", async (t) => {
  let clock = new Date("2026-01-01T00:00:00.000Z");
  const { rootDir, baseUrl } = await fixture(t, (_request, response) => {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("data");
  });
  const collector = new FileCollector({ rootDir, now: () => clock, retryBaseMs: 1 });
  await collector.collect({ sourceId: "verified-old", url: baseUrl });
  await collector.setDriveStatus("verified-old", "drive_verified");
  await collector.collect({ sourceId: "buffered-old", url: baseUrl });

  clock = new Date("2026-01-31T00:00:01.000Z");
  const result = await collector.purgeVerified({ retentionDays: 30 });
  assert.deepEqual(result.purged, ["verified-old"]);
  await assert.rejects(stat(join(rootDir, "records/verified-old")), { code: "ENOENT" });
  assert.equal((await stat(join(rootDir, "records/buffered-old"))).isDirectory(), true);
});
