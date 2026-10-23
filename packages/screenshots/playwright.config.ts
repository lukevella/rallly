import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

config({ path: "../../apps/web/.env" });

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./capture",
  outputDir: "./test-results",
  projects: [{ name: "chromium" }],
  use: {
    viewport: { width: 1440, height: 900 },
    baseURL,
  },
  webServer: {
    // Every conferencing provider is on, as in production, so the docs show
    // the full video call menu. Webex falls back to a placeholder app because
    // the dev .env carries no Webex credentials and nothing here calls it.
    command: `NEXT_PUBLIC_BASE_URL=${baseURL} NEXT_PUBLIC_COOKIE_DOMAIN= RATE_LIMIT_ENABLED=false HIDE_DEV_INDICATOR=true CONFERENCING_PROVIDERS=google-meet,zoom,microsoft-teams,webex WEBEX_CLIENT_ID=\${WEBEX_CLIENT_ID:-screenshots} WEBEX_CLIENT_SECRET=\${WEBEX_CLIENT_SECRET:-screenshots} pnpm --filter @rallly/web exec next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  retries: 0,
  workers: 1,
});
