import { defineConfig } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
  worker: {
    name: "sentry-tunnel",
    entrypoint,
    compatibilityDate: "2026-10-01",
    // A first-party host so ad blockers that drop *.sentry.io leave browser
    // events alone, served from Cloudflare so they don't count as Vercel
    // requests.
    domains: ["e.rallly.co"],
    workersDev: false,
    previewUrls: false,
    observability: { enabled: true, headSamplingRate: 0.01 },
  },
});
