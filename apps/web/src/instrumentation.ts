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

    // Conferencing is optional, so a provider turned on without its OAuth
    // app must not stop the server; it is simply not offered.
    const { enabledConferencingProviders, getConfiguredConferencingProviders } =
      await import("@/features/conferencing/constants");
    const configured = getConfiguredConferencingProviders();
    const unconfigured = enabledConferencingProviders.filter(
      (provider) => !configured.includes(provider),
    );
    if (unconfigured.length > 0) {
      const { createLogger } = await import("@rallly/logger");
      createLogger("conferencing").warn(
        { providers: unconfigured },
        "CONFERENCING_PROVIDERS lists providers without OAuth app credentials, so they are not offered.",
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
