import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/App-perso/developer-os/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/apple-touch-icon-180.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-192.svg",
        "icons/icon-512.svg",
      ],
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/App-perso/developer-os/index.html",
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
      },
      manifest: {
        name: "DeveloperOS",
        short_name: "DeveloperOS",
        description: "Poste de pilotage local-first",
        theme_color: "#101828",
        background_color: "#f6f7fb",
        display: "standalone",
        start_url: "/App-perso/developer-os/",
        scope: "/App-perso/developer-os/",
        icons: [
          {
            src: "/App-perso/developer-os/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/App-perso/developer-os/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/App-perso/developer-os/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/App-perso/developer-os/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    globals: true,
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
