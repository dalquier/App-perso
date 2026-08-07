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

  it("uses the hardened BUILD-04 service-worker cache identifier", () => {
    expect(readApp("public/sw.js")).toContain('const CACHE = "equilibre-shell-v6"');
  });

  it("provides a root Replit launch command and leaves port routing to Replit auto-detection", () => {
    const replit = readRepo(".replit");
    expect(replit).toContain('run = "./start-equilibre.sh"');
    expect(replit).not.toContain("[[ports]]");
    expect(replit).not.toContain("localPort");
    expect(replit).not.toContain("externalPort");
    expect(replit).not.toMatch(/BUILD-?0?3|Validation/i);
  });

  it("installs deterministically, builds, and serves the production preview on all interfaces", () => {
    const script = readRepo("start-equilibre.sh");
    expect(script).toContain("npm ci");
    expect(script).toContain("npm run build");
    expect(script).toContain("npm run preview");
    expect(script).not.toContain("npm run dev");
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
