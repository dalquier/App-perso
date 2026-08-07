import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";

const pngIcons = [
  ["public/icons/apple-touch-icon-180.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
] as const;

describe("PWA static contract", () => {
  it("defines CSP, apple icon and production PWA assets", () => {
    const html = readFileSync("index.html", "utf8");
    const vite = readFileSync("vite.config.ts", "utf8");
    const gitignore = readFileSync(".gitignore", "utf8");

    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain('%BASE_URL%icons/apple-touch-icon-180.png');
    expect(html).toContain('%BASE_URL%icons/icon-192.png');
    expect(html).toContain('%BASE_URL%icons/icon-512.png');
    expect(vite).toContain("icon-192.png");
    expect(vite).toContain("icon-512.png");
    expect(vite).toContain("navigateFallback");
    expect(vite).toContain('base: "/App-perso/developer-os/"');
    expect(vite).toContain('start_url: "/App-perso/developer-os/"');
    expect(vite).toContain('scope: "/App-perso/developer-os/"');
    expect(vite).toContain(
      'navigateFallback: "/App-perso/developer-os/index.html"',
    );
    expect(gitignore).toContain("public/icons/apple-touch-icon-180.png");
    expect(gitignore).toContain("public/icons/icon-192.png");
    expect(gitignore).toContain("public/icons/icon-512.png");
  });

  it("generates the required PNG icons from the versioned SVG source", async () => {
    expect(existsSync("public/icons/icon-512.svg")).toBe(true);

    for (const [iconPath, size] of pngIcons) {
      expect(existsSync(iconPath)).toBe(true);
      const metadata = await sharp(iconPath).metadata();
      expect(metadata.format).toBe("png");
      expect(metadata.width).toBe(size);
      expect(metadata.height).toBe(size);
    }
  });
});
