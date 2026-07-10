// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Initializes the PostHog browser client (side-effect import).
import "@rallly/posthog/client";
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
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
    // Known upstream Firefox error thrown from inside the bundled rrweb
    // session-replay code (@sentry-internal/replay): when a replay starts
    // recording on error, rrweb can touch a DOM node the browser has already
    // garbage-collected, throwing "TypeError: can't access dead object". This
    // originates in vendored code, not our own logic, and only clutters error
    // tracking. https://bugzilla.mozilla.org/show_bug.cgi?id=695480
    "can't access dead object",
  ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // Only record replays for sessions with errors
  replaysSessionSampleRate: 0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
