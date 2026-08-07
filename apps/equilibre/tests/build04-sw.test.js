import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

describe("BUILD-04C3 — service worker", () => {
  it("utilise un cache de shell BUILD-04 renouvelé", () => {
    expect(source).toContain('const CACHE_PREFIX = "equilibre-shell-"');
    expect(source).toContain('const CACHE = "equilibre-shell-v6"');
    expect(source).toContain('"/manifest.webmanifest"');
    expect(source).toContain('"/icons/icon-192.png"');
    expect(source).toContain('"/icons/icon-512.png"');
  });

  it("force un préchargement sans cache HTTP du shell", () => {
    expect(source).toContain('new Request(url, { cache: "reload" })');
  });

  it("ignore les méthodes non GET et les origines distantes", () => {
    expect(source).toContain('event.request.method !== "GET"');
    expect(source).toContain("url.origin !== self.location.origin");
  });

  it("ne met en cache que les réponses réseau réussies", () => {
    expect(source).toContain("if (response.ok)");
    expect(source).toContain("cache.put(event.request, copy)");
  });

  it("bypasse le cache HTTP pour les navigations et réserve le fallback HTML aux navigations", () => {
    expect(source).toContain('event.request.mode === "navigate"');
    expect(source).toContain('isNavigation ? { cache: "no-store" } : undefined');
    expect(source).toContain('if (isNavigation) return caches.match("/")');
    expect(source).toContain("return Response.error()");
  });

  it("supprime uniquement les anciens caches Équilibre à l'activation", () => {
    expect(source).toContain("key.startsWith(CACHE_PREFIX) && key !== CACHE");
    expect(source).toContain("caches.delete(key)");
    expect(source).toContain("self.clients.claim()");
  });
});
