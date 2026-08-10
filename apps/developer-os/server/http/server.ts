import type { FastifyInstance } from "fastify";
import { loadServerCoreConfig, type ServerCoreConfig } from "../config";
import { createApp } from "./app";

export async function startServer(config: ServerCoreConfig, app: FastifyInstance = createApp({ config, logger: true })): Promise<FastifyInstance> {
  await app.listen({ host: config.host, port: config.port });
  app.server.headersTimeout = config.headersTimeoutMs;
  app.server.requestTimeout = config.requestTimeoutMs;
  app.server.keepAliveTimeout = config.keepAliveTimeoutMs;
  return app;
}

export function installShutdownHandlers(app: FastifyInstance, graceMs: number): () => void {
  let stopping = false;
  const stop = (): void => {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => app.server.closeAllConnections(), graceMs);
    timer.unref();
    void app.close().finally(() => clearTimeout(timer));
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  return () => { process.removeListener("SIGTERM", stop); process.removeListener("SIGINT", stop); };
}

export async function main(): Promise<void> {
  const config = loadServerCoreConfig();
  const app = await startServer(config);
  installShutdownHandlers(app, config.gracefulShutdownMs);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) void main();
