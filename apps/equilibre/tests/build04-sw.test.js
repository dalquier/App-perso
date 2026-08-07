import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

describe("BUILD-04C3 — service worker", () => {
  it("utilise un cache de shell BUILD-04 dédié", () => {
    expect(source).toContain('const CACHE = "equilibre-shell-v5"');
    expect(source).toContain('"/manifest.webmanifest"');
    expect(source).toContain('"/icons/icon-192.png"');
    expect(source).toContain('"/icons/icon-512.png"');
  });

  it("ignore les méthodes non GET et les origines distantes", () => {
    expect(source).toContain('event.request.method !== "GET"');
    expect(source).toContain("url.origin !== self.location.origin");
  });

  it("ne met en cache que les réponses réseau réussies", () => {
    expect(source).toContain("if (response.ok)");
    expect(source).toContain("cache.put(event.request, copy)");
  });

  it("réserve le fallback HTML aux navigations", () => {
    expect(source).toContain('event.request.mode === "navigate"');
    expect(source).toContain('if (isNavigation) return caches.match("/")');
    expect(source).toContain("return Response.error()");
  });

  it("supprime les anciens caches à l'activation", () => {
    expect(source).toContain("keys.filter((key) => key !== CACHE)");
    expect(source).toContain("caches.delete(key)");
    expect(source).toContain("self.clients.claim()");
  });
});
