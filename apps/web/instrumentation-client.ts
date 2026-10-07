// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Initializes the PostHog browser client (side-effect import).
import "@rallly/posthog/client";
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  sendDefaultPii: false,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.2,

  ignoreErrors: [
    // Transient browser network errors (offline, aborted navigation,
    // connection blips, ad blockers). These surface as generic `TypeError`s
    // from background fetches (e.g. better-auth's session poll) and are
    // unactionable noise rather than real application bugs.
    "Failed to fetch",
    "NetworkError when attempting to fetch resource",
    "Load failed",
    "The network connection was lost",
    "The Internet connection appears to be offline",
  ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
