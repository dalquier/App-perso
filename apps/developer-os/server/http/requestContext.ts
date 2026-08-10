import { randomUUID } from "node:crypto";
import type { FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest { requestContext: Readonly<{ requestId: string; startedAt: number }>; }
}

export function createRequestContext(): FastifyRequest["requestContext"] {
  return Object.freeze({ requestId: randomUUID(), startedAt: performance.now() });
}
