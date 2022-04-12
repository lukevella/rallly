import { devices, PlaywrightTestConfig } from "@playwright/test";

const ci = process.env.CI === "true";

// Reference: https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: "test-results/",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    viewport: { width: 1280, height: 720 },
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  reporter: [
    [ci ? "github" : "list"],
    ["html", { open: !ci ? "on-failure" : "never" }],
  ],
  workers: 1,
};
export default config;
