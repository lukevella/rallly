import "server-only";

import { createLogger } from "@rallly/logger";
import { Context, Data, Effect, Layer } from "effect";
import { createSharedRate } from "@/lib/rate-limit";
import {
  QUEUED_EMAIL_RATE_WAIT_MS,
  QUEUED_EMAIL_SENDS_PER_SECOND,
} from "./constants";
import type { QueuedEmailKind } from "./types";

const logger = createLogger("email-queue");

/** The subject is gone, or no longer warrants the email. Not retried. */
export class QueuedEmailSkipped extends Data.TaggedError("QueuedEmailSkipped")<{
  reason: string;
}> {}

/** The attempt failed and may be retried. `message` lands in `lastError`. */
export class QueuedEmailFailed extends Data.TaggedError("QueuedEmailFailed")<{
  message: string;
}> {}

/** Builds one email from its subject, as the subject is now, and sends it. */
export type QueuedEmailHandler = (email: {
  id: string;
  subjectId: string;
}) => Effect.Effect<void, QueuedEmailSkipped | QueuedEmailFailed>;

/**
 * One handler per kind. The queue knows nothing about what it sends: each
 * feature that queues email owns its handler, and the layer that collects
 * them is built outside the features so none of them imports another.
 */
export class QueuedEmailHandlers extends Context.Service<
  QueuedEmailHandlers,
  Record<QueuedEmailKind, QueuedEmailHandler>
>()("rallly/email-queue/QueuedEmailHandlers") {}

/**
 * The send rate every queue run shares, across processes. `acquire` waits
 * for a slot and answers false if none freed up in time. Without Redis
 * there is no shared rate and every send goes ahead; a failure to reach
 * Redis does the same, logged, rather than stalling the queue.
 */
export class SendRateLimiter extends Context.Service<
  SendRateLimiter,
  { acquire(): Effect.Effect<boolean> }
>()("rallly/email-queue/SendRateLimiter") {
  static readonly layer = Layer.sync(SendRateLimiter, () => {
    const rate = createSharedRate(QUEUED_EMAIL_SENDS_PER_SECOND, "1 s");
    return SendRateLimiter.of({
      acquire: () =>
        rate
          ? Effect.tryPromise(() =>
              rate.acquire("email-queue:send", QUEUED_EMAIL_RATE_WAIT_MS),
            ).pipe(
              Effect.catch((error) =>
                Effect.sync(() => {
                  logger.error(
                    { error },
                    "Shared send rate unavailable, sending unthrottled",
                  );
                  return true;
                }),
              ),
            )
          : Effect.succeed(true),
    });
  });
}
