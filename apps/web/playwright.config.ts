import { loadEnvConfig } from "@next/env";
import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const ci = process.env.CI === "true";

loadEnvConfig(process.cwd());

const port = process.env.PORT || 3002;
// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

// Reference: https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
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
  },
  reporter: [
    [ci ? "github" : "list"],
    ["html", { open: !ci ? "on-failure" : "never" }],
  ],
  workers: 1,
};
export default config;
