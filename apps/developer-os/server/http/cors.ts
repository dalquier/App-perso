import type { FastifyInstance } from "fastify";
import { ServerError } from "../errors";

const ALLOWED_METHODS = "GET, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

export function registerStrictCors(app: FastifyInstance, allowedOrigin: string): void {
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/v1")) return;
    const origin = request.headers.origin;
    if (origin !== undefined) {
      reply.header("Vary", "Origin");
      if (origin !== allowedOrigin) throw new ServerError("ORIGIN_NOT_ALLOWED", "The request origin is not allowed.");
      reply.header("Access-Control-Allow-Origin", allowedOrigin);
    }
    if (request.method === "OPTIONS") {
      reply.header("Access-Control-Allow-Methods", ALLOWED_METHODS);
      reply.header("Access-Control-Allow-Headers", ALLOWED_HEADERS);
      reply.code(204).send();
    }
  });
}
