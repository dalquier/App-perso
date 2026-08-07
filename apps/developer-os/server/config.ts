import { ServerError } from "./errors";

export const SERVER_LIMIT_BOUNDS = Object.freeze({
  maxRequestBytes: { default: 1_048_576, min: 1_024, max: 5_242_880 },
  maxPromptCharacters: { default: 200_000, min: 1_000, max: 1_000_000 },
  maxOutputTokens: { default: 8_192, min: 1, max: 100_000 },
  maxApiConcurrency: { default: 2, min: 1, max: 10 },
  openAiTimeoutMs: { default: 60_000, min: 1_000, max: 300_000 },
} as const);

export interface ServerConfig {
  nodeEnv: "development" | "test" | "production";
  openAiApiKey: string;
  databaseUrl: string;
  allowedOrigin: string;
  limits: {
    maxRequestBytes: number;
    maxPromptCharacters: number;
    maxOutputTokens: number;
    maxApiConcurrency: number;
    openAiTimeoutMs: number;
  };
}

type Environment = Readonly<Record<string, string | undefined>>;
const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

function required(env: Environment, name: string, errors: string[]): string {
  const value = env[name]?.trim();
  if (!value) errors.push(`${name} is required.`);
  return value ?? "";
}

function integer(
  env: Environment,
  name: string,
  bounds: { default: number; min: number; max: number },
  errors: string[],
): number {
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

function secureUrl(raw: string, name: string, protocols: readonly string[], errors: string[]): string {
  try {
    const url = new URL(raw);
    if (!protocols.includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    errors.push(`${name} must be an origin using ${protocols.join(" or ")} without credentials, path, query or fragment.`);
    return "";
  }
}

function postgresUrl(raw: string, errors: string[]): string {
  try {
    const url = new URL(raw);
    const databaseName = url.pathname.slice(1);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      !databaseName ||
      databaseName.includes("/") ||
      url.hash
    ) {
      throw new Error();
    }
    return raw;
  } catch {
    errors.push(
      "DATABASE_URL must be a PostgreSQL URL with a host and database name.",
    );
    return "";
  }
}

export function loadServerConfig(env: Environment = process.env): ServerConfig {
  const errors: string[] = [];
  const nodeEnv = env.NODE_ENV?.trim() || "development";
  if (!NODE_ENVIRONMENTS.includes(nodeEnv as never)) {
    errors.push("NODE_ENV must be development, test or production.");
  }
  const openAiApiKey = required(env, "OPENAI_API_KEY", errors);
  const databaseUrlRaw = required(env, "DATABASE_URL", errors);
  const databaseUrl = databaseUrlRaw ? postgresUrl(databaseUrlRaw, errors) : "";
  const originRaw = required(env, "DEVELOPEROS_ALLOWED_ORIGIN", errors);
  const allowedOrigin = originRaw
    ? secureUrl(originRaw, "DEVELOPEROS_ALLOWED_ORIGIN", nodeEnv === "production" ? ["https:"] : ["http:", "https:"], errors)
    : "";
  const limits = {
    maxRequestBytes: integer(env, "DEVELOPEROS_MAX_REQUEST_BYTES", SERVER_LIMIT_BOUNDS.maxRequestBytes, errors),
    maxPromptCharacters: integer(env, "DEVELOPEROS_MAX_PROMPT_CHARACTERS", SERVER_LIMIT_BOUNDS.maxPromptCharacters, errors),
    maxOutputTokens: integer(env, "DEVELOPEROS_MAX_OUTPUT_TOKENS", SERVER_LIMIT_BOUNDS.maxOutputTokens, errors),
    maxApiConcurrency: integer(env, "DEVELOPEROS_MAX_API_CONCURRENCY", SERVER_LIMIT_BOUNDS.maxApiConcurrency, errors),
    openAiTimeoutMs: integer(env, "DEVELOPEROS_OPENAI_TIMEOUT_MS", SERVER_LIMIT_BOUNDS.openAiTimeoutMs, errors),
  };
  if (errors.length) throw new ServerError("configuration_invalid", "Server configuration is invalid.", errors);
  return { nodeEnv: nodeEnv as ServerConfig["nodeEnv"], openAiApiKey, databaseUrl, allowedOrigin, limits };
}
