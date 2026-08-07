import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(appRoot, "../..");
const readApp = (path) => readFileSync(resolve(appRoot, path), "utf8");
const readRepo = (path) => readFileSync(resolve(repoRoot, path), "utf8");

describe("BUILD-04 delivery contract", () => {
  it("uses Équilibre as the HTML and PWA product name", () => {
    const html = readApp("index.html");
    const manifest = JSON.parse(readApp("public/manifest.webmanifest"));

    expect(html).toContain("<title>Équilibre</title>");
    expect(html).toContain('content="Équilibre"');
    expect(manifest.name).toMatch(/^Équilibre\b/);
    expect(manifest.short_name).toBe("Équilibre");
  });

  it("keeps the BUILD-04 service-worker cache identifier", () => {
    expect(readApp("public/sw.js")).toContain('const CACHE = "equilibre-shell-v5"');
  });

  it("provides a root Replit launch command for the stable product script", () => {
    const replit = readRepo(".replit");
    expect(replit).toContain('run = "./start-equilibre.sh"');
    expect(replit).toContain("localPort = 5000");
    expect(replit).not.toMatch(/BUILD-?0?3|Validation/i);
  });

  it("installs deterministically and starts Vite on the Replit host and port", () => {
    const script = readRepo("start-equilibre.sh");
    expect(script).toContain("npm ci");
    expect(script).toContain("--host 0.0.0.0");
    expect(script).toContain('--port "$PORT"');
    expect(script).toContain("--strictPort");
    expect(statSync(resolve(repoRoot, "start-equilibre.sh")).mode & 0o111).toBeTruthy();
  });

  it("does not expose a BUILD3 or Validation product name in launch surfaces", () => {
    const launchSurfaces = [
      readApp("index.html"),
      readApp("public/manifest.webmanifest"),
      readApp("README.md"),
      readRepo(".replit"),
      readRepo("start-equilibre.sh"),
    ].join("\n");
    expect(launchSurfaces).not.toMatch(/É?quilibre\s+(?:BUILD-?0?3|Validation)/i);
  });
});
