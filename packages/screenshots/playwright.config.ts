import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: "../../.env" });

const port = process.env.PORT || 3000;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./capture",
  outputDir: "./test-results",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    viewport: { width: 1440, height: 900 },
    baseURL,
  },
  webServer: {
    command: `HIDE_DEV_INDICATOR=true pnpm --filter @rallly/web exec next dev --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: true,
    timeout: 30000,
  },
  retries: 0,
  workers: 1,
});
