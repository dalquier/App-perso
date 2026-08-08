import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dirname, "..");
const readApp = (path) => readFileSync(resolve(appRoot, path), "utf8");

describe("V4 compact UX polish", () => {
  it("loads the polish module after the main application", () => {
    const html = readApp("index.html");
    expect(html).toContain('src="/src/app.js"');
    expect(html).toContain('src="/src/ui/compactPolish.js"');
    expect(html.indexOf('/src/app.js')).toBeLessThan(html.indexOf('/src/ui/compactPolish.js'));
  });

  it("turns all protocol information cards into native details closed by default", () => {
    const source = readApp("src/ui/compactPolish.js");
    expect(source).toContain('document.createElement("details")');
    expect(source).toContain('"À savoir avant de commencer"');
    expect(source).toContain('querySelectorAll(":scope > section")');
    expect(source).toContain('limits.classList.add("protocol-info-card")');
    expect(source).not.toMatch(/\.open\s*=|setAttribute\(["']open/);
  });

  it("keeps the conversation title fixed and reduces vertical density", () => {
    const css = readApp("src/ui/compactPolish.css");
    expect(css).toMatch(/\.chat-toolbar\s*\{[^}]*position:fixed/s);
    expect(css).toContain(".chat-toolbar + .chat-log");
    expect(css).toMatch(/\.hero\s*\{[^}]*padding:24px/s);
    expect(css).toMatch(/\.protocol-question-card\s*\{[^}]*padding:16px/s);
    expect(css).toMatch(/\.protocol-info-card\s*\{[^}]*padding:10px 14px/s);
  });

  it("uses one UI font family for headings while preserving the brand mark exception", () => {
    const css = readApp("src/ui/compactPolish.css");
    expect(css).toMatch(/h1,[\s\S]*\.protocol-index\s*\{\s*font-family:inherit;/);
    expect(css).not.toContain("Georgia");
  });
});
