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
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
