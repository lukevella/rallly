import * as Sentry from "@sentry/nextjs";

export const onRequestError = Sentry.captureRequestError;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Before Sentry, so its outbound traffic is proxied too. The import must
    // stay dynamic: a top-level import would be hoisted into the Edge bundle,
    // where undici doesn't exist.
    const { setupOutboundProxy } = await import("@/lib/outbound-proxy");
    setupOutboundProxy();

    await import("../sentry.server.config");

    // Conferencing is optional, so a switch with no provider behind it must
    // not stop the server; organizers can still paste their own link.
    const { getAvailableConferencingProviders, isConferencingEnabled } =
      await import("@/features/conferencing/constants");
    if (
      isConferencingEnabled &&
      getAvailableConferencingProviders().length === 0
    ) {
      const { createLogger } = await import("@rallly/logger");
      createLogger("conferencing").warn(
        "CONFERENCING_ENABLED is set but no provider is configured, so none is offered. Set the OAuth app variables for Zoom, Google Meet, Microsoft Teams or Webex.",
      );
    }

    // On Vercel the house-keeping cron runs the email queue; everywhere else
    // (dev, the self-hosted image) a long-lived server runs it itself. Never
    // during a build, which must not touch the database.
    if (
      !process.env.VERCEL &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      const { startQueuedEmailScheduler } = await import("@/emails/queue");
      startQueuedEmailScheduler();
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
