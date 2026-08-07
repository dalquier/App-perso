#!/usr/bin/env node
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { ArchiveMcpService } from "./mcp-service.js";
import { createMcpHandler } from "./mcp-protocol.js";

const rootDir = process.env.ARCHIVE_ROOT_DIR;
if (!rootDir) throw new Error("ARCHIVE_ROOT_DIR is required");
const handle = createMcpHandler(new ArchiveMcpService({ rootDir }));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const bearerToken = process.env.ARCHIVE_BEARER_TOKEN;
if (!bearerToken) throw new Error("ARCHIVE_BEARER_TOKEN is required");

function authorized(request) {
  const supplied = request.headers.authorization || "";
  const expected = `Bearer ${bearerToken}`;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/mcp") {
    response.writeHead(404).end(); return;
  }
  if (!authorized(request)) {
    response.writeHead(401, { "www-authenticate": "Bearer" }).end(); return;
  }
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 1024 * 1024) throw Object.assign(new Error("Request too large"), { status: 413 });
      chunks.push(chunk);
    }
    const output = await handle(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!output) { response.writeHead(202).end(); return; }
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(output));
  } catch (error) {
    response.writeHead(error.status || 400, { "content-type": "application/json" })
      .end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: error.message } }));
  }
}).listen(port, host, () => process.stderr.write(`MCP listening on ${host}:${port}/mcp\n`));
