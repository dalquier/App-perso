import { describe, expect, it } from "vitest";
import type { ServerCoreConfig } from "../config";
import { createApp } from "./app";
import { startServer } from "./server";

const config: ServerCoreConfig = { nodeEnv: "test", host: "127.0.0.1", port: 0, allowedOrigin: "https://dalquier.github.io", maxRequestBytes: 1_024, headersTimeoutMs: 2_000, requestTimeoutMs: 3_000, keepAliveTimeoutMs: 1_000, gracefulShutdownMs: 1_000 };

describe("HTTP server lifecycle", () => {
  it("starts on a controlled ephemeral port, applies timeouts and closes cleanly", async () => {
    const app = createApp({ config });
    await startServer(config, app);
    expect(app.server.listening).toBe(true);
    expect(app.server.headersTimeout).toBe(2_000);
    expect(app.server.requestTimeout).toBe(3_000);
    expect(app.server.keepAliveTimeout).toBe(1_000);
    await app.close();
    expect(app.server.listening).toBe(false);
  });
});
