// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Initializes the PostHog browser client (side-effect import).
import "@rallly/posthog/client";
import * as Sentry from "@sentry/nextjs";
import {
  getChunkRecoveryContext,
  isModuleFactoryError,
  reloadOnceForChunkError,
} from "@/lib/chunk-recovery";
import { getChunkRegistrationContext } from "@/lib/chunk-registration-log";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  // Release health sessions (one envelope per page load) and client reports
  // (stats on events the SDK dropped) were most of the tunnel's requests and
  // nothing reads them. Errors and traces are unaffected.
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== "BrowserSession"),
  sendClientReports: false,
  // Don't send personal identifiable information (PII) to Sentry. Every
  // category defaults to on, so each one that can carry PII is off here.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    databaseQueryData: false,
    genAI: { inputs: false, outputs: false },
    stackFrameVariables: false,
  },
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
    // Thrown by Safari and DuckDuckGo extension content scripts on iOS, not by
    // the app. Replays show the page rendering normally around it.
    "Invalid call to runtime.sendMessage",
  ],

  beforeSend(event, hint) {
    if (isModuleFactoryError(hint.originalException)) {
      const context = getChunkRecoveryContext();
      event.tags = {
        ...event.tags,
        chunk_reloaded_recently: context.reloadedRecently,
      };
      event.contexts = {
        ...event.contexts,
        chunk_recovery: context,
        chunk_registrations: getChunkRegistrationContext(
          String(
            hint.originalException instanceof Error
              ? hint.originalException.message
              : hint.originalException,
          ),
        ),
      };
    }
    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Errors React catches in an error boundary reach the boundary instead; see
// app/[locale]/error.tsx and app/global-error.tsx.
window.addEventListener("error", (event) =>
  reloadOnceForChunkError(event.error),
);
window.addEventListener("unhandledrejection", (event) =>
  reloadOnceForChunkError(event.reason),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
