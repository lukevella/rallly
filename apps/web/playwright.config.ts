import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.test" });

const ci = process.env.CI === "true";

const port = process.env.PORT || 3002;
// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${port}`;

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: "test-results/",
  // Local runs use `next dev`, where on-demand route compilation during a
  // full-suite run can eat most of the default 30s budget before a test's
  // final assertion. CI runs a production build and keeps the default.
  timeout: ci ? 30_000 : 60_000,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL,
    permissions: ["clipboard-read"],
    trace: "retain-on-failure",
  },
  testDir: "./tests",
  // Smoke specs run against the production Docker image via
  // playwright.smoke.config.ts, not the dev/test server.
  testIgnore: "**/smoke/**",
  webServer: {
    // Local runs clear .next first: Turbopack's persistent dev cache
    // (default on since Next 16.1) is shared across dev sessions, and a
    // server killed mid-write — which is how every Playwright run ends —
    // can leave it in a state that deadlocks on-demand route compiles in
    // the next run. That surfaces as tests timing out on pages no earlier
    // test has visited, while already-compiled routes keep working.
    command: ci
      ? `next start --port ${port}`
      : `rm -rf .next && next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !ci,
    env: {
      // Next layers env files from apps/web (notably the developer's .env) on
      // top of the process env, leaking dev vars into the test server — e.g.
      // NEXT_PUBLIC_COOKIE_DOMAIN breaks every authenticated flow. @next/env
      // skips env file loading entirely when this flag is set, so the server
      // only sees the .env.test values loaded above.
      __NEXT_PROCESSED_ENV: "true",
    },
  },
  reporter: [
    [ci ? "github" : "list"],
    ["html", { open: !ci ? "on-failure" : "never" }],
  ],
  workers: 1,
});
