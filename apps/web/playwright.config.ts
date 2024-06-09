import { devices, PlaywrightTestConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

const ci = process.env.CI === "true";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const port = process.env.PORT || 3000;
// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${port}`;

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
  webServer: ci
    ? {
        command: `NODE_ENV=test next start --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
      }
    : {
        command: `NODE_ENV=test next dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
      },
  reporter: [
    [ci ? "github" : "list"],
    ["html", { open: !ci ? "on-failure" : "never" }],
  ],
  workers: 1,
};
export default config;
