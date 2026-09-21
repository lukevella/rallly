import "server-only";

import type { LookupAddress, LookupOptions } from "node:dns";
import { lookup } from "node:dns";
import { isIP } from "node:net";
import { Clock, Context, Effect, Layer, Schema } from "effect";
import type { Dispatcher } from "undici";
import { getGlobalDispatcher } from "undici";
import { createOutboundDispatcher } from "@/lib/outbound-proxy";
import { DELIVERY_TIMEOUT_MS } from "./constants";
import { isPrivateAddress, signWebhookBody } from "./utils";

/**
 * Why one delivery attempt did not get a 2xx. `message` is what the
 * delivery row stores in `lastError`.
 */
export class WebhookSendError extends Schema.TaggedError<WebhookSendError>()(
  "WebhookSendError",
  {
    reason: Schema.Literals([
      "invalid_url",
      "insecure_target",
      "private_address",
      "timeout",
      "http_status",
      "network",
    ]),
    status: Schema.NullOr(Schema.Number),
    message: Schema.String,
  },
) {}

/**
 * Local development and the integration suite point endpoints at loopback,
 * which the sender otherwise refuses. Never set in production. Tests
 * provide a value instead of mutating the environment.
 */
export const AllowPrivateTargets = Context.Reference<boolean>(
  "rallly/webhook/AllowPrivateTargets",
  { defaultValue: () => process.env.WEBHOOK_ALLOW_PRIVATE_URLS === "true" },
);

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

/**
 * Cheap rejections before any connection is made. IP literals never go
 * through a lookup, so they are the one case that must be judged here.
 */
function parseTarget({
  url,
  allowPrivateTargets,
}: {
  url: string;
  allowPrivateTargets: boolean;
}) {
  return Effect.try({
    try: () => new URL(url),
    catch: () =>
      new WebhookSendError({
        reason: "invalid_url",
        status: null,
        message: "Invalid webhook URL",
      }),
  }).pipe(
    Effect.flatMap((target) => {
      if (allowPrivateTargets) {
        return Effect.succeed(target);
      }
      if (target.protocol !== "https:") {
        return new WebhookSendError({
          reason: "insecure_target",
          status: null,
          message: "Webhook URL must use https",
        });
      }
      const hostname = target.hostname.replace(/^\[|\]$/g, "");
      if (isIP(hostname) && isPrivateAddress(hostname)) {
        return new WebhookSendError({
          reason: "private_address",
          status: null,
          message: "Webhook host is a private address",
        });
      }
      return Effect.succeed(target);
    }),
  );
}

/**
 * A rejected fetch. The guarded lookup surfaces as the cause of a TypeError,
 * so it is recognised here and reported as the private address it is.
 */
function toRequestError(error: unknown) {
  if (error instanceof Error && error.cause instanceof PrivateAddressError) {
    return new WebhookSendError({
      reason: "private_address",
      status: null,
      message: error.cause.message,
    });
  }
  const message =
    error instanceof Error
      ? (error.cause instanceof Error ? error.cause.message : null) ||
        error.message
      : "Request failed";
  return new WebhookSendError({
    reason: "network",
    status: null,
    message: message.slice(0, 500),
  });
}

/**
 * Memoized at module level, not in the layer: the layer is provided per
 * dispatcher run, and the connection pool should outlive a run.
 */
let guardedDispatcher: Dispatcher | null = null;

/**
 * Direct connections pin the guarded lookup, including hosts that NO_PROXY
 * exempts from a configured proxy. Proxied connections are made by the proxy,
 * which resolves the hostname itself, so pinning is not possible there; the
 * proxy operator controls what it can reach.
 */
function getDispatcher(allowPrivateTargets: boolean) {
  if (allowPrivateTargets) {
    return getGlobalDispatcher();
  }
  guardedDispatcher ??= createOutboundDispatcher({
    connect: { lookup: guardedLookup },
  });
  return guardedDispatcher;
}

const timeoutError = new WebhookSendError({
  reason: "timeout",
  status: null,
  message: `Timed out after ${DELIVERY_TIMEOUT_MS / 1000}s`,
});

/**
 * POSTs one signed event to an endpoint. A 2xx response succeeds with its
 * status; anything else, including redirects, which are never followed
 * because the redirect target was not checked, fails with a
 * `WebhookSendError` the caller folds into the delivery row and schedules a
 * retry for.
 */
export class WebhookSender extends Context.Service<
  WebhookSender,
  {
    send(input: {
      url: string;
      secret: string;
      deliveryId: string;
      eventType: string;
      /**
       * The version the body was built against, read from the stored
       * payload rather than the current constant: payloads are frozen at
       * fan-out, so a delivery retried after a version change must keep
       * advertising the contract its body actually follows. Absent on
       * deliveries fanned out before the version existed, which are sent
       * without the header.
       */
      version: string | null;
      body: string;
    }): Effect.Effect<{ status: number }, WebhookSendError>;
  }
>()("rallly/webhook/WebhookSender") {
  static readonly layer = Layer.sync(WebhookSender, () => {
    const send = Effect.fn("WebhookSender.send")(function* ({
      url,
      secret,
      deliveryId,
      eventType,
      version,
      body,
    }: {
      url: string;
      secret: string;
      deliveryId: string;
      eventType: string;
      version: string | null;
      body: string;
    }) {
      const allowPrivateTargets = yield* AllowPrivateTargets;
      const target = yield* parseTarget({ url, allowPrivateTargets });
      const timestamp = Math.floor((yield* Clock.currentTimeMillis) / 1000);
      const signature = yield* Effect.tryPromise({
        try: () => signWebhookBody({ secret, body, timestamp }),
        catch: toRequestError,
      });

      // The fiber's signal reaches the socket, so a timeout cancels the
      // request instead of leaving it to finish in the background.
      const response = yield* Effect.tryPromise({
        try: (signal) =>
          fetch(target, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Rallly-Webhooks/1.0",
              "X-Rallly-Event": eventType,
              ...(version ? { "X-Rallly-Webhook-Version": version } : {}),
              "X-Rallly-Delivery": deliveryId,
              "X-Rallly-Signature": signature,
            },
            body,
            redirect: "manual",
            signal,
            // Node extension, absent from the DOM RequestInit type.
            ...({ dispatcher: getDispatcher(allowPrivateTargets) } as object),
          }),
        catch: toRequestError,
      }).pipe(
        Effect.timeout(DELIVERY_TIMEOUT_MS),
        Effect.catchTag("TimeoutError", () => timeoutError),
      );

      // The body is irrelevant and untrusted: release the socket without
      // buffering it.
      yield* Effect.promise(
        () =>
          response.body?.cancel().catch(() => undefined) ?? Promise.resolve(),
      );

      if (response.ok) {
        return { status: response.status };
      }
      return yield* new WebhookSendError({
        reason: "http_status",
        status: response.status,
        message: `HTTP ${response.status}`,
      });
    });

    return WebhookSender.of({ send });
  });
}
