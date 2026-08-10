import "server-only";

import { createLogger } from "@rallly/logger";
import { EnvHttpProxyAgent, setGlobalDispatcher } from "undici";

const logger = createLogger("outbound-proxy");

const PROXY_ENV_VARS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "http_proxy",
  "https_proxy",
] as const;

// Proxy URLs may carry credentials (http://user:pass@proxy) — never log them.
function sanitize(value: string) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.href;
  } catch {
    return "<invalid URL>";
  }
}

/**
 * Loopback traffic is never proxied, regardless of NO_PROXY: a CONNECT to
 * "localhost" through a remote proxy reaches the proxy's loopback, never this
 * container's, so proxying it is categorically wrong. Go's
 * ProxyFromEnvironment applies the same rule. The undici matcher compares
 * entries literally (no CIDR, no name/IP resolution), so both name and
 * address forms are listed. "localhost" also covers *.localhost via the
 * matcher's subdomain rule.
 */
const LOOPBACK_NO_PROXY = "localhost,127.0.0.1,[::1]";

/**
 * Node's built-in fetch ignores proxy environment variables, so on networks
 * with no direct egress (self-hosted behind a corporate proxy) outbound calls
 * never reach the proxy at all. EnvHttpProxyAgent honors HTTP_PROXY /
 * HTTPS_PROXY / NO_PROXY in both cases. Node consults the global dispatcher
 * on every fetch, but anything fetched before this runs goes direct — call it
 * first at boot.
 *
 * Node 24's experimental NODE_USE_ENV_PROXY does the same thing natively;
 * when it stabilizes, this module can be deleted in its favor.
 */
export function setupOutboundProxy() {
  const configured = PROXY_ENV_VARS.filter((name) => process.env[name]);

  if (configured.length === 0) {
    return;
  }

  const noProxy = [
    process.env.no_proxy ?? process.env.NO_PROXY,
    LOOPBACK_NO_PROXY,
  ]
    .filter(Boolean)
    .join(",");

  setGlobalDispatcher(new EnvHttpProxyAgent({ noProxy }));

  logger.info(
    {
      proxies: Object.fromEntries(
        configured.map((name) => [name, sanitize(process.env[name] as string)]),
      ),
      noProxy,
    },
    "Outbound proxy enabled: fetch will route through the configured proxy",
  );
}
