import { ServerError } from "./errors";

export const SERVER_CORE_LIMIT_BOUNDS = Object.freeze({
  maxRequestBytes: { default: 1_048_576, min: 1_024, max: 5_242_880 },
  headersTimeoutMs: { default: 10_000, min: 1_000, max: 60_000 },
  requestTimeoutMs: { default: 15_000, min: 1_000, max: 120_000 },
  keepAliveTimeoutMs: { default: 5_000, min: 1_000, max: 60_000 },
  gracefulShutdownMs: { default: 10_000, min: 1_000, max: 10_000 },
} as const);

export const OPENAI_PROVIDER_LIMIT_BOUNDS = Object.freeze({
  maxPromptCharacters: { default: 200_000, min: 1_000, max: 1_000_000 },
  maxOutputTokens: { default: 8_192, min: 1, max: 100_000 },
  maxApiConcurrency: { default: 2, min: 1, max: 10 },
  openAiTimeoutMs: { default: 60_000, min: 1_000, max: 300_000 },
} as const);

export interface ServerCoreConfig {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  allowedOrigin: string;
  maxRequestBytes: number;
  headersTimeoutMs: number;
  requestTimeoutMs: number;
  keepAliveTimeoutMs: number;
  gracefulShutdownMs: number;
}

export interface OpenAIProviderConfig {
  openAiApiKey: string;
  maxPromptCharacters: number;
  maxOutputTokens: number;
  maxApiConcurrency: number;
  openAiTimeoutMs: number;
}

type Environment = Readonly<Record<string, string | undefined>>;
const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

function required(env: Environment, name: string, errors: string[]): string {
  const value = env[name]?.trim();
  if (!value) errors.push(`${name} is required.`);
  return value ?? "";
}

function integer(env: Environment, name: string, bounds: { default: number; min: number; max: number }, errors: string[]): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return bounds.default;
  if (!/^\d+$/.test(raw)) {
    errors.push(`${name} must be an integer between ${bounds.min} and ${bounds.max}.`);
    return bounds.default;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < bounds.min || value > bounds.max) {
    errors.push(`${name} must be an integer between ${bounds.min} and ${bounds.max}.`);
    return bounds.default;
  }
  return value;
}

function secureOrigin(raw: string, nodeEnv: string, errors: string[]): string {
  try {
    if (raw === "*") throw new Error();
    const url = new URL(raw);
    const protocols = nodeEnv === "production" ? ["https:"] : ["http:", "https:"];
    if (!protocols.includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash || raw.endsWith("/")) throw new Error();
    return url.origin;
  } catch {
    errors.push("DEVELOPEROS_ALLOWED_ORIGIN must be an exact origin without credentials, path, query, fragment or wildcard.");
    return "";
  }
}

export function loadServerCoreConfig(env: Environment = process.env): ServerCoreConfig {
  const errors: string[] = [];
  const nodeEnv = env.NODE_ENV?.trim() || "development";
  if (!NODE_ENVIRONMENTS.includes(nodeEnv as never)) errors.push("NODE_ENV must be development, test or production.");
  const originRaw = required(env, "DEVELOPEROS_ALLOWED_ORIGIN", errors);
  const allowedOrigin = originRaw ? secureOrigin(originRaw, nodeEnv, errors) : "";
  const config = {
    nodeEnv: nodeEnv as ServerCoreConfig["nodeEnv"],
    host: env.DEVELOPEROS_HOST?.trim() || "0.0.0.0",
    port: integer(env, "PORT", { default: 3_000, min: 1, max: 65_535 }, errors),
    allowedOrigin,
    maxRequestBytes: integer(env, "DEVELOPEROS_MAX_REQUEST_BYTES", SERVER_CORE_LIMIT_BOUNDS.maxRequestBytes, errors),
    headersTimeoutMs: integer(env, "DEVELOPEROS_HEADERS_TIMEOUT_MS", SERVER_CORE_LIMIT_BOUNDS.headersTimeoutMs, errors),
    requestTimeoutMs: integer(env, "DEVELOPEROS_REQUEST_TIMEOUT_MS", SERVER_CORE_LIMIT_BOUNDS.requestTimeoutMs, errors),
    keepAliveTimeoutMs: integer(env, "DEVELOPEROS_KEEP_ALIVE_TIMEOUT_MS", SERVER_CORE_LIMIT_BOUNDS.keepAliveTimeoutMs, errors),
    gracefulShutdownMs: integer(env, "DEVELOPEROS_GRACEFUL_SHUTDOWN_MS", SERVER_CORE_LIMIT_BOUNDS.gracefulShutdownMs, errors),
  };
  if (errors.length) throw new ServerError("configuration_invalid", "Server configuration is invalid.", errors);
  return config;
}

/** Loaded only when the real OpenAI provider is composed in a later increment. */
export function loadOpenAIProviderConfig(env: Environment = process.env): OpenAIProviderConfig {
  const errors: string[] = [];
  const config = {
    openAiApiKey: required(env, "OPENAI_API_KEY", errors),
    maxPromptCharacters: integer(env, "DEVELOPEROS_MAX_PROMPT_CHARACTERS", OPENAI_PROVIDER_LIMIT_BOUNDS.maxPromptCharacters, errors),
    maxOutputTokens: integer(env, "DEVELOPEROS_MAX_OUTPUT_TOKENS", OPENAI_PROVIDER_LIMIT_BOUNDS.maxOutputTokens, errors),
    maxApiConcurrency: integer(env, "DEVELOPEROS_MAX_API_CONCURRENCY", OPENAI_PROVIDER_LIMIT_BOUNDS.maxApiConcurrency, errors),
    openAiTimeoutMs: integer(env, "DEVELOPEROS_OPENAI_TIMEOUT_MS", OPENAI_PROVIDER_LIMIT_BOUNDS.openAiTimeoutMs, errors),
  };
  if (errors.length) throw new ServerError("configuration_invalid", "OpenAI provider configuration is invalid.", errors);
  return config;
}

/** Compatibility name now intentionally loads only the B1 HTTP core. */
export const loadServerConfig = loadServerCoreConfig;
export const SERVER_LIMIT_BOUNDS = { ...SERVER_CORE_LIMIT_BOUNDS, ...OPENAI_PROVIDER_LIMIT_BOUNDS } as const;
