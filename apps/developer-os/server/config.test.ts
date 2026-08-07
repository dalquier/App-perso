import { describe, expect, it } from "vitest";
import { loadServerConfig, SERVER_LIMIT_BOUNDS } from "./config";
import { ServerError, toSafeErrorBody } from "./errors";

const valid = {
  NODE_ENV: "test",
  OPENAI_API_KEY: "test-placeholder-not-a-real-key",
  DATABASE_URL: "postgresql://user:password@localhost/developeros_test",
  DEVELOPEROS_ALLOWED_ORIGIN: "http://localhost:4173",
} as const;

describe("loadServerConfig", () => {
  it("loads validated values and bounded defaults", () => {
    const config = loadServerConfig(valid);
    expect(config.limits).toEqual(Object.fromEntries(Object.entries(SERVER_LIMIT_BOUNDS).map(([key, value]) => [key, value.default])));
    expect(config.allowedOrigin).toBe("http://localhost:4173");
  });

  it("parses configurable limits", () => {
    const config = loadServerConfig({ ...valid, DEVELOPEROS_MAX_API_CONCURRENCY: "4", DEVELOPEROS_OPENAI_TIMEOUT_MS: "90000" });
    expect(config.limits.maxApiConcurrency).toBe(4);
    expect(config.limits.openAiTimeoutMs).toBe(90_000);
  });

  it("accepts a PostgreSQL URL with connection options", () => {
    const config = loadServerConfig({
      ...valid,
      DATABASE_URL:
        "postgres://user:password@database.example/developeros?sslmode=require",
    });
    expect(config.databaseUrl).toContain("sslmode=require");
  });

  it.each([
    "file:unsafe",
    "postgresql://localhost",
    "postgresql:///developeros",
    "postgresql://localhost/one/two",
    "postgresql://localhost/developeros#fragment",
  ])("rejects malformed DATABASE_URL without reflecting it: %s", (databaseUrl) => {
    expect(() => loadServerConfig({ ...valid, DATABASE_URL: databaseUrl })).toThrow(
      expect.objectContaining({ code: "configuration_invalid" }),
    );
    try {
      loadServerConfig({ ...valid, DATABASE_URL: databaseUrl });
    } catch (error) {
      expect(JSON.stringify(toSafeErrorBody(error))).not.toContain(databaseUrl);
    }
  });

  it("rejects missing, malformed and out-of-range settings without leaking values", () => {
    const secret = "sensitive-value-that-must-not-leak";
    expect.assertions(4);
    try {
      loadServerConfig({ NODE_ENV: "production", OPENAI_API_KEY: secret, DATABASE_URL: "postgresql://localhost/database", DEVELOPEROS_ALLOWED_ORIGIN: "http://user:pass@example.test/path", DEVELOPEROS_MAX_API_CONCURRENCY: "999" });
    } catch (error) {
      expect(error).toBeInstanceOf(ServerError);
      const serialized = JSON.stringify(toSafeErrorBody(error));
      expect(serialized).not.toContain(secret);
      expect(serialized).not.toContain("user:pass");
      expect(toSafeErrorBody(error).error.code).toBe("configuration_invalid");
    }
  });
});

describe("safe errors", () => {
  it("does not expose unknown errors", () => {
    expect(toSafeErrorBody(new Error("private provider detail"))).toEqual({ error: { code: "provider_unavailable", message: "The server could not complete the request." } });
  });
});
