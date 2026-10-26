import { defineConfig, devices } from "@playwright/test";

// Runs the OIDC specs against an already-running stack (rallly + Authentik
// from docker compose) — no webServer. The regular suite and the smoke config
// do not pick these up.
const baseURL = process.env.OIDC_E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  outputDir: "test-results/",
  timeout: 90_000,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL,
    permissions: ["clipboard-read"],
    trace: "retain-on-failure",
  },
  testDir: "./tests/oidc",
  reporter: [[process.env.CI === "true" ? "github" : "list"]],
});
