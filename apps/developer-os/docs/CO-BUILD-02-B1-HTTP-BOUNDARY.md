# CO-BUILD-02 — B1 HTTP Boundary

B1 introduces the separately hosted Node.js 20 HTTP boundary only. It adds no authentication, session, database, run persistence, OpenAI call, scheduler, queue, or frontend integration.

## Architecture

- Fastify provides a small maintained HTTP core, bounded parsing, injection testing, and lifecycle APIs. Its transitive Pino logger supports explicit redaction without logging request bodies.
- `server/http/app.ts` builds an injectable application without opening a port.
- `server/http/server.ts` is the composition root for configuration, listening, Node timeouts, and graceful `SIGINT`/`SIGTERM` shutdown.
- `server/http/cors.ts` enforces an exact configured origin. Production uses `https://dalquier.github.io`; the GitHub Pages path is not an origin.
- `server/http/requestContext.ts` creates cryptographically random server request identifiers.

## Configuration and operation

Only `DEVELOPEROS_ALLOWED_ORIGIN` is mandatory for the HTTP core. `OPENAI_API_KEY` is loaded separately only by the future OpenAI provider, and `DATABASE_URL` is reserved for B2. All byte and timeout values have inclusive bounds in `server/config.ts`.

Start locally after configuring the environment:

```sh
npm run server:start
```

The public route is `GET /api/v1/health`. Browser requests with another origin receive `403 ORIGIN_NOT_ALLOWED`. Preflight permits `GET`, `OPTIONS`, `Content-Type`, and `Authorization`, without enabling authentication, cookies, credentials, or CSRF state.

JSON routes registered in later increments inherit a strict `application/json` requirement and a byte limit applied even without `Content-Length`. Safe structured failures carry the server-generated request ID and never serialize unknown exception details.
