import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["html", { open: "never" }], ["list"]],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/App-perso/developer-os/",
    reuseExistingServer: false,
  },
  use: {
    baseURL: "http://127.0.0.1:4173/App-perso/developer-os/",
    trace: "retain-on-failure",
    browserName: "chromium",
  },
  projects: [
    {
      name: "iPhone SE",
      use: { ...devices["iPhone SE"], browserName: "chromium" },
    },
    {
      name: "iPhone 13",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
