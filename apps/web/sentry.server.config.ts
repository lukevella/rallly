// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.2,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Don't send personal identifiable information (PII) to Sentry.
  sendDefaultPii: false,

  // Ship the 4xx/5xx wide events as structured logs so rate limiter usage
  // (`rateLimiterDailyConsumedPoints`, 429s per `spaceId`) is queryable and
  // alertable for 30 days. Info-level events are every request; they stay in
  // Vercel to keep the log quota for the ones worth searching.
  enableLogs: true,
  integrations: [
    Sentry.pinoIntegration({ log: { levels: ["warn", "error", "fatal"] } }),
  ],
  beforeSendLog(log) {
    // `sendDefaultPii` does not cover custom log attributes.
    if (log.attributes) {
      const { ip, ...attributes } = log.attributes;
      return { ...log, attributes };
    }
    return log;
  },

  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
});
