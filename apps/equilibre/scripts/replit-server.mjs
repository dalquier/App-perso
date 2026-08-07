import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = resolve(appRoot, "dist");
const host = "0.0.0.0";
const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT invalide: ${process.env.PORT}`);
}

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
]);

const insideDist = (path) => path === distRoot || path.startsWith(`${distRoot}${sep}`);

async function existingFile(pathname) {
  const candidate = resolve(distRoot, `.${pathname}`);
  if (!insideDist(candidate)) return null;
  try {
    const info = await stat(candidate);
    return info.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

function cacheControl(file) {
  if (file.endsWith(`${sep}index.html`) || file.endsWith(`${sep}sw.js`) || file.endsWith(`${sep}manifest.webmanifest`)) {
    return "no-store";
  }
  if (file.includes(`${sep}assets${sep}`)) return "public, max-age=31536000, immutable";
  return "public, max-age=300";
}

const server = createServer(async (request, response) => {
  try {
    if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    const url = new URL(request.url, "http://replit.local");
    const pathname = decodeURIComponent(url.pathname);
    let file = await existingFile(pathname === "/" ? "/index.html" : pathname);

    if (!file && !extname(pathname)) file = resolve(distRoot, "index.html");
    if (!file || !insideDist(file)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      response.end("Not found");
      return;
    }

    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime.get(extname(file)) || "application/octet-stream",
      "Content-Length": body.byteLength,
      "Cache-Control": cacheControl(file),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    if (request.method === "HEAD") response.end();
    else response.end(body);
  } catch (error) {
    console.error("Équilibre server error", error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Internal server error");
  }
});

server.listen(port, host, () => {
  console.log(`EQUILIBRE_READY http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
