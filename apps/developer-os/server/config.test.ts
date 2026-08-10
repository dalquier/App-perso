import { describe, expect, it } from "vitest";
import { loadOpenAIProviderConfig, loadServerCoreConfig, SERVER_CORE_LIMIT_BOUNDS } from "./config";
import { ServerError, toSafeErrorBody } from "./errors";

const production = { NODE_ENV: "production", DEVELOPEROS_ALLOWED_ORIGIN: "https://dalquier.github.io" } as const;

describe("loadServerCoreConfig", () => {
  it("starts without OpenAI or database configuration", () => {
    const config = loadServerCoreConfig(production);
    expect(config.allowedOrigin).toBe("https://dalquier.github.io");
    expect(config.maxRequestBytes).toBe(1_048_576);
    expect(config).not.toHaveProperty("openAiApiKey");
    expect(config).not.toHaveProperty("databaseUrl");
  });

  it.each(["http://dalquier.github.io", "https://user:pass@dalquier.github.io", "https://dalquier.github.io/path", "https://dalquier.github.io?x=1", "https://dalquier.github.io#x", "*"])("rejects unsafe production origin %s", (origin) => {
    expect(() => loadServerCoreConfig({ ...production, DEVELOPEROS_ALLOWED_ORIGIN: origin })).toThrow(expect.objectContaining({ code: "configuration_invalid" }));
  });

  it("accepts inclusive bounds for every core limit", () => {
    for (const [key, bounds] of Object.entries(SERVER_CORE_LIMIT_BOUNDS)) {
      const envName = `DEVELOPEROS_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`;
      expect(loadServerCoreConfig({ ...production, [envName]: String(bounds.min) })[key as keyof typeof SERVER_CORE_LIMIT_BOUNDS]).toBe(bounds.min);
      expect(loadServerCoreConfig({ ...production, [envName]: String(bounds.max) })[key as keyof typeof SERVER_CORE_LIMIT_BOUNDS]).toBe(bounds.max);
    }
  });

  it.each(["1023", "5242881", "1.5", "NaN"])("rejects invalid request byte limit %s", (value) => {
    expect(() => loadServerCoreConfig({ ...production, DEVELOPEROS_MAX_REQUEST_BYTES: value })).toThrow(ServerError);
  });

  it("loads provider configuration separately and preserves validated bounds", () => {
    expect(loadOpenAIProviderConfig({ OPENAI_API_KEY: "test-placeholder", DEVELOPEROS_OPENAI_TIMEOUT_MS: "90000" })).toMatchObject({ openAiApiKey: "test-placeholder", openAiTimeoutMs: 90_000 });
    expect(() => loadOpenAIProviderConfig({})).toThrow(expect.objectContaining({ code: "configuration_invalid" }));
  });
});

describe("safe errors", () => {
  it("does not expose unknown provider errors", () => {
    expect(toSafeErrorBody(new Error("private provider detail"))).toEqual({ error: { code: "provider_unavailable", message: "The server could not complete the request." } });
  });
});
