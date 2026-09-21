import { encrypt } from "@rallly/utils/encryption";
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

// `@/env` validates at import and refuses to run under jsdom. One config
// module stubbed with the single value the mutation reads; the sender, the
// dependency under test, is a real layer.
vi.mock("@/env", () => ({
  env: { SECRET_PASSWORD: "0123456789abcdef0123456789abcdef" },
}));

import { env } from "@/env";
import { attemptDelivery } from "./mutations";
import { WebhookSendError, WebhookSender } from "./service";

/** A sender whose every send has the given outcome. */
function senderThat(
  outcome: Effect.Effect<{ status: number }, WebhookSendError>,
) {
  return Layer.succeed(
    WebhookSender,
    WebhookSender.of({ send: () => outcome }),
  );
}

function delivery(secret: string) {
  return {
    id: "d_1",
    eventType: "poll.closed",
    payload: { version: "2026-09-20", event: "poll.closed" },
    webhook: { url: "https://example.com/hook", secret },
  };
}

describe("attemptDelivery", () => {
  const encrypted = encrypt("whsec_test", env.SECRET_PASSWORD);

  it("records a 2xx as a successful attempt", async () => {
    const result = await Effect.runPromise(
      attemptDelivery(delivery(encrypted)).pipe(
        Effect.provide(senderThat(Effect.succeed({ status: 204 }))),
      ),
    );
    expect(result).toEqual({ ok: true, status: 204 });
  });

  it("folds a send error into a failed attempt carrying its status and message", async () => {
    const result = await Effect.runPromise(
      attemptDelivery(delivery(encrypted)).pipe(
        Effect.provide(
          senderThat(
            new WebhookSendError({
              reason: "http_status",
              status: 503,
              message: "HTTP 503",
            }),
          ),
        ),
      ),
    );
    expect(result).toEqual({ ok: false, status: 503, error: "HTTP 503" });
  });

  it("fails the attempt without sending when the secret cannot be decrypted", async () => {
    let sends = 0;
    const result = await Effect.runPromise(
      attemptDelivery(delivery("not-a-ciphertext")).pipe(
        Effect.provide(
          senderThat(
            Effect.sync(() => {
              sends++;
              return { status: 200 };
            }),
          ),
        ),
      ),
    );
    expect(result).toEqual({
      ok: false,
      status: null,
      error: "Could not decrypt the endpoint secret",
    });
    expect(sends).toBe(0);
  });
});
