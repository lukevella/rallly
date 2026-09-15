import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
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

/**
 * Resolves the host up front so a public hostname that points at a private
 * address (DNS rebinding, a misconfigured record) is refused before any
 * connection is made. The connection itself goes through global fetch, so
 * it honors the outbound proxy set up at boot (lib/outbound-proxy.ts).
 */
async function getTargetRejection(url: URL) {
  if (allowsPrivateTargets()) {
    return null;
  }
  if (url.protocol !== "https:") {
    return "Webhook URL must use https";
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0) {
    return "Webhook host did not resolve";
  }
  if (addresses.some((address) => isPrivateAddress(address))) {
    return "Webhook host resolves to a private address";
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

  try {
    const rejection = await getTargetRejection(target);
    if (rejection) {
      return { ok: false, status: null, error: rejection };
    }

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
    });
    // Drain so the socket is released; the body itself is irrelevant.
    await response.arrayBuffer().catch(() => undefined);

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
