import { defineConfig, devices } from "@playwright/test";

// Runs the smoke specs against an already-running production image (the
// docker compose stack in CI) — no webServer, no .env.test. The regular
// integration suite covers app behavior; this config exists to verify the
// artifact self-hosters actually run: standalone build output, runtime env
// injection, and client hydration.
const baseURL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  outputDir: "test-results/",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL,
    trace: "retain-on-failure",
  },
  testDir: "./tests/smoke",
  reporter: [[process.env.CI === "true" ? "github" : "list"]],
});
