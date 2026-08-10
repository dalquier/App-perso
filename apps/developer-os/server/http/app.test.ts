import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { ServerCoreConfig } from "../config";
import { ServerError } from "../errors";
import { createApp } from "./app";

const config: ServerCoreConfig = {
  nodeEnv: "test", host: "127.0.0.1", port: 3_000,
  allowedOrigin: "https://dalquier.github.io", maxRequestBytes: 1_024,
  headersTimeoutMs: 10_000, requestTimeoutMs: 15_000,
  keepAliveTimeoutMs: 5_000, gracefulShutdownMs: 10_000,
};
const apps: FastifyInstance[] = [];
function app(registerTestRoutes?: (instance: FastifyInstance) => void, overrides: Partial<ServerCoreConfig> = {}) {
  const instance = createApp({ config: { ...config, ...overrides }, registerTestRoutes });
  apps.push(instance);
  return instance;
}
afterEach(async () => Promise.all(apps.splice(0).map(async (instance) => instance.close())));

describe("HTTP boundary", () => {
  it("returns the stable health response with a server-generated request ID", async () => {
    const response = await app().inject({ method: "GET", url: "/api/v1/health", headers: { "x-request-id": "client-secret" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { status: "ok", service: "developeros-backend" }, requestId: response.headers["x-request-id"] });
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body).not.toMatch(/client-secret|DATABASE_URL|OPENAI|hostname|stack/i);
  });

  it("generates unique request IDs", async () => {
    const instance = app();
    const [first, second] = await Promise.all([instance.inject({ url: "/api/v1/health" }), instance.inject({ url: "/api/v1/health" })]);
    expect(first.headers["x-request-id"]).not.toBe(second.headers["x-request-id"]);
  });

  it("allows only the exact configured origin without credentials", async () => {
    const response = await app().inject({ url: "/api/v1/health", headers: { origin: config.allowedOrigin } });
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(config.allowedOrigin);
    expect(response.headers.vary).toContain("Origin");
    expect(response.headers).not.toHaveProperty("access-control-allow-credentials");
    expect(response.headers["access-control-allow-origin"]).not.toBe("*");
  });

  it.each(["https://evil.example", "https://sub.dalquier.github.io", "https://dalquier.github.io.evil.example", "https://dalquier.github.io:444"])("rejects hostile origin %s", async (origin) => {
    const response = await app().inject({ url: "/api/v1/health", headers: { origin } });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: { code: "ORIGIN_NOT_ALLOWED" }, requestId: response.headers["x-request-id"] });
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers valid preflight with explicit methods and future headers", async () => {
    const response = await app().inject({ method: "OPTIONS", url: "/api/v1/health", headers: { origin: config.allowedOrigin, "access-control-request-method": "GET", "access-control-request-headers": "content-type, authorization" } });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toBe("GET, OPTIONS");
    expect(response.headers["access-control-allow-headers"]).toBe("Content-Type, Authorization");
    expect(response.headers["access-control-allow-origin"]).toBe(config.allowedOrigin);
  });

  it("rejects hostile preflight", async () => {
    const response = await app().inject({ method: "OPTIONS", url: "/api/v1/health", headers: { origin: "https://evil.example" } });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("ORIGIN_NOT_ALLOWED");
  });

  it("parses bounded JSON and distinguishes malformed and unsupported bodies", async () => {
    const instance = app((testApp) => testApp.post("/api/v1/test-json", async (request) => ({ data: request.body, requestId: request.id })));
    const valid = await instance.inject({ method: "POST", url: "/api/v1/test-json", headers: { "content-type": "application/json" }, payload: '{"ok":true}' });
    expect(valid.statusCode).toBe(200);
    expect(valid.json().data).toEqual({ ok: true });
    const malformed = await instance.inject({ method: "POST", url: "/api/v1/test-json", headers: { "content-type": "application/json" }, payload: "{" });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json().error.code).toBe("INVALID_JSON");
    const unsupported = await instance.inject({ method: "POST", url: "/api/v1/test-json", headers: { "content-type": "text/plain" }, payload: "hello" });
    expect(unsupported.statusCode).toBe(415);
    expect(unsupported.json().error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("accepts the exact byte limit and rejects one byte above", async () => {
    const instance = app((testApp) => testApp.post("/api/v1/test-json", async (request) => request.body), { maxRequestBytes: 1_024 });
    const exact = `"${"a".repeat(1_022)}"`;
    expect(Buffer.byteLength(exact)).toBe(1_024);
    expect((await instance.inject({ method: "POST", url: "/api/v1/test-json", headers: { "content-type": "application/json" }, payload: exact })).statusCode).toBe(200);
    const oversized = `"${"a".repeat(1_023)}"`;
    const response = await instance.inject({ method: "POST", url: "/api/v1/test-json", headers: { "content-type": "application/json" }, payload: oversized });
    expect(response.statusCode).toBe(413);
    expect(response.json().error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("bounds chunked bodies without Content-Length", async () => {
    const instance = app((testApp) => testApp.post("/api/v1/test-json", async (request) => request.body));
    const response = await instance.inject({ method: "POST", url: "/api/v1/test-json", headers: { "content-type": "application/json", "transfer-encoding": "chunked" }, payload: `"${"a".repeat(1_100)}"` });
    expect(response.statusCode).toBe(413);
  });

  it("returns structured 404, 405 and safe internal errors", async () => {
    const instance = app((testApp) => testApp.get("/api/v1/failure", async () => { throw new Error("secret Authorization Bearer local/path"); }));
    const missing = await instance.inject({ url: "/api/v1/missing" });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error.code).toBe("NOT_FOUND");
    const method = await instance.inject({ method: "POST", url: "/api/v1/health" });
    expect(method.statusCode).toBe(405);
    expect(method.json().error.code).toBe("METHOD_NOT_ALLOWED");
    const failure = await instance.inject({ url: "/api/v1/failure" });
    expect(failure.statusCode).toBe(500);
    expect(failure.json()).toMatchObject({ error: { code: "INTERNAL_ERROR" }, requestId: failure.headers["x-request-id"] });
    expect(failure.body).not.toMatch(/secret|Bearer|local\/path|stack/i);
  });

  it("exposes stable validation and timeout error infrastructure", async () => {
    const instance = app((testApp) => {
      testApp.get("/api/v1/validation", async () => { throw new ServerError("VALIDATION_FAILED", "The request did not match the expected schema."); });
      testApp.get("/api/v1/timeout", async () => { throw new ServerError("REQUEST_TIMEOUT", "The request timed out."); });
    });
    expect((await instance.inject({ url: "/api/v1/validation" })).statusCode).toBe(422);
    expect((await instance.inject({ url: "/api/v1/timeout" })).statusCode).toBe(408);
  });
});
