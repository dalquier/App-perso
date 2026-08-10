import Fastify, { LogController, type FastifyInstance } from "fastify";
import type { ServerCoreConfig } from "../config";
import { ServerError, toSafeErrorBody } from "../errors";
import { registerStrictCors } from "./cors";
import { createRequestContext } from "./requestContext";

export interface CreateAppOptions {
  config: ServerCoreConfig;
  logger?: boolean;
  registerTestRoutes?: (app: FastifyInstance) => void;
}

const STATUS_BY_CODE: Partial<Record<ServerError["code"], number>> = {
  INVALID_JSON: 400, PAYLOAD_TOO_LARGE: 413, UNSUPPORTED_MEDIA_TYPE: 415,
  VALIDATION_FAILED: 422, ORIGIN_NOT_ALLOWED: 403, NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405, REQUEST_TIMEOUT: 408, INTERNAL_ERROR: 500,
};

export function createApp({ config, logger = false, registerTestRoutes }: CreateAppOptions): FastifyInstance {
  const app = Fastify({
    logger: logger ? { redact: { paths: ["req.headers.authorization", "req.headers.cookie", "body", "prompt", "responseRaw"], censor: "[REDACTED]" } } : false,
    bodyLimit: config.maxRequestBytes,
    requestTimeout: config.requestTimeoutMs,
    connectionTimeout: config.requestTimeoutMs,
    keepAliveTimeout: config.keepAliveTimeoutMs,
    requestIdHeader: false,
    genReqId: () => createRequestContext().requestId,
    logController: new LogController({ disableRequestLogging: true }),
  });

  app.decorateRequest("requestContext");
  app.addHook("onRequest", async (request, reply) => {
    request.requestContext = Object.freeze({ requestId: request.id, startedAt: performance.now() });
    reply.header("X-Request-ID", request.id);
  });
  registerStrictCors(app, config.allowedOrigin);
  app.addHook("onRequest", async (request) => {
    if (!request.routeOptions.url || !request.url.startsWith("/api/v1") || !["POST", "PUT", "PATCH"].includes(request.method)) return;
    const contentType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
    if (contentType !== "application/json") throw new ServerError("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.");
  });

  app.get("/api/v1/health", async (request) => ({ data: { status: "ok", service: "developeros-backend" }, requestId: request.requestContext.requestId }));
  registerTestRoutes?.(app);

  app.setNotFoundHandler(async (request, reply) => {
    const healthPath = request.url.split("?", 1)[0] === "/api/v1/health";
    const error = healthPath
      ? new ServerError("METHOD_NOT_ALLOWED", "The HTTP method is not allowed for this route.")
      : new ServerError("NOT_FOUND", "The requested route was not found.");
    if (healthPath) reply.header("Allow", "GET, OPTIONS");
    return reply.code(healthPath ? 405 : 404).send(toSafeErrorBody(error, request.requestContext.requestId));
  });

  app.setErrorHandler(async (error, request, reply) => {
    let safeError: ServerError;
    const fastifyCode = (error as { code?: string }).code;
    if (error instanceof ServerError) safeError = error;
    else if (fastifyCode === "FST_ERR_CTP_INVALID_MEDIA_TYPE") safeError = new ServerError("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.");
    else if (fastifyCode === "FST_ERR_CTP_BODY_TOO_LARGE") safeError = new ServerError("PAYLOAD_TOO_LARGE", "The request body exceeds the allowed size.");
    else if (fastifyCode === "FST_ERR_CTP_INVALID_JSON_BODY" || error instanceof SyntaxError) safeError = new ServerError("INVALID_JSON", "The request body is not valid JSON.");
    else safeError = new ServerError("INTERNAL_ERROR", "The server could not complete the request.");
    return reply.code(STATUS_BY_CODE[safeError.code] ?? 500).send(toSafeErrorBody(safeError, request.requestContext.requestId));
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info({ requestId: request.id, method: request.method, route: request.routeOptions.url, status: reply.statusCode, durationMs: Math.round(performance.now() - request.requestContext.startedAt) }, "request completed");
  });
  return app;
}
