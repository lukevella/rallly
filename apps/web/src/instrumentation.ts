import * as Sentry from "@sentry/nextjs";

export const onRequestError = Sentry.captureRequestError;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node's built-in fetch ignores proxy environment variables, so on
    // networks with no direct egress (self-hosted behind a corporate proxy)
    // outbound calls never reach the proxy at all. EnvHttpProxyAgent honors
    // HTTP_PROXY / HTTPS_PROXY / NO_PROXY in both cases. This must run before
    // the first fetch — including Sentry's — and the import must stay dynamic:
    // a top-level import would be hoisted into the Edge bundle, where undici
    // doesn't exist.
    if (
      process.env.HTTP_PROXY ||
      process.env.HTTPS_PROXY ||
      process.env.http_proxy ||
      process.env.https_proxy
    ) {
      const { EnvHttpProxyAgent, setGlobalDispatcher } = await import("undici");
      setGlobalDispatcher(new EnvHttpProxyAgent());
    }

    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
