import "server-only";

import type { LookupAddress, LookupOptions } from "node:dns";
import { lookup } from "node:dns";
import { isIP } from "node:net";
import { Agent, getGlobalDispatcher } from "undici";
import { isOutboundProxyConfigured } from "@/lib/outbound-proxy";
import { DELIVERY_TIMEOUT_MS } from "./constants";
import { isPrivateAddress, signWebhookBody } from "./utils";

export type WebhookSendResult =
  | { ok: true; status: number }
  | { ok: false; status: number | null; error: string };

/**
 * Local development and the integration suite point endpoints at loopback,
 * which the sender otherwise refuses. Never set in production.
 */
function allowsPrivateTargets() {
  return process.env.WEBHOOK_ALLOW_PRIVATE_URLS === "true";
}

export class PrivateAddressError extends Error {
  constructor() {
    super("Webhook host resolves to a private address");
    this.name = "PrivateAddressError";
  }
}

/**
 * A `net.connect` lookup that refuses private addresses. Installed on the
 * connection itself so the address that passes the check is the address the
 * socket connects to: a separate pre-check would leave a window for DNS
 * rebinding between the check and the connect.
 */
export function guardedLookup(
  hostname: string,
  options: LookupOptions,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | LookupAddress[],
    family?: number,
  ) => void,
) {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      return callback(err, []);
    }
    if (addresses.some((entry) => isPrivateAddress(entry.address))) {
      return callback(new PrivateAddressError(), []);
    }
    if (options.all) {
      return callback(null, addresses);
    }
    const [first] = addresses;
    if (!first) {
      return callback(
        Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), {
          code: "ENOTFOUND",
        }),
        [],
      );
    }
    callback(null, first.address, first.family);
  });
}

let guardedAgent: Agent | null = null;

/**
 * Direct connections pin the guarded lookup. Behind an outbound proxy the
 * proxy resolves the hostname and makes the connection, so pinning is not
 * possible there; the proxy operator controls what it can reach.
 */
function getDispatcher() {
  if (allowsPrivateTargets() || isOutboundProxyConfigured()) {
    return getGlobalDispatcher();
  }
  guardedAgent ??= new Agent({ connect: { lookup: guardedLookup } });
  return guardedAgent;
}

/**
 * Cheap rejections before any connection is made. IP literals never go
 * through a lookup, so they are the one case that must be judged here.
 */
function getTargetRejection(url: URL) {
  if (allowsPrivateTargets()) {
    return null;
  }
  if (url.protocol !== "https:") {
    return "Webhook URL must use https";
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname) && isPrivateAddress(hostname)) {
    return "Webhook host is a private address";
  }
  return null;
}

/**
 * POSTs one signed event to an endpoint. A 2xx response is a success;
 * anything else — including redirects, which are never followed because
 * the redirect target was not checked — is a failure the caller schedules a
 * retry for. Never throws: the outcome is the return value.
 */
export async function sendWebhook({
  url,
  secret,
  deliveryId,
  eventType,
  body,
}: {
  url: string;
  secret: string;
  deliveryId: string;
  eventType: string;
  body: string;
}): Promise<WebhookSendResult> {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return { ok: false, status: null, error: "Invalid webhook URL" };
  }

  const rejection = getTargetRejection(target);
  if (rejection) {
    return { ok: false, status: null, error: rejection };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await signWebhookBody({ secret, body, timestamp });
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Rallly-Webhooks/1.0",
        "X-Rallly-Event": eventType,
        "X-Rallly-Delivery": deliveryId,
        "X-Rallly-Signature": signature,
      },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      // Node extension, absent from the DOM RequestInit type.
      ...({ dispatcher: getDispatcher() } as object),
    });
    // The body is irrelevant and untrusted: release the socket without
    // buffering it.
    await response.body?.cancel().catch(() => undefined);

    if (response.ok) {
      return { ok: true, status: response.status };
    }
    return {
      ok: false,
      status: response.status,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? `Timed out after ${DELIVERY_TIMEOUT_MS / 1000}s`
          : (error.cause instanceof Error ? error.cause.message : null) ||
            error.message
        : "Request failed";
    return { ok: false, status: null, error: message.slice(0, 500) };
  }
}
