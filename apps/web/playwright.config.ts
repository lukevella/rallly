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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL,
    permissions: ["clipboard-read"],
    trace: "retain-on-failure",
  },
  testDir: "./tests",
  webServer: {
    command: ci ? `next start --port ${port}` : `next dev --port ${port}`,
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
