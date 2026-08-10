#!/usr/bin/env node
import { createInterface } from "node:readline";
import { ArchiveMcpService } from "./mcp-service.js";
import { createMcpHandler } from "./mcp-protocol.js";

const rootDir = process.env.ARCHIVE_ROOT_DIR;
if (!rootDir) throw new Error("ARCHIVE_ROOT_DIR is required");
const handle = createMcpHandler(new ArchiveMcpService({ rootDir }));
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of lines) {
  if (!line.trim()) continue;
  let response;
  try { response = await handle(JSON.parse(line)); }
  catch { response = { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }; }
  if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
}
