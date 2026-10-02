import "server-only";

import type { Effect } from "effect";
import { Context, Data } from "effect";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import type { QueuedEmailKind } from "./types";

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
 * Whether a failed email stays queued for another attempt. Retries are
 * picked up by the house-keeping cron, so an instance without it fails the
 * email on the first error instead of leaving it pending for good.
 */
export const RetryQueuedEmails = Context.Reference<boolean>(
  "rallly/email-queue/RetryQueuedEmails",
  { defaultValue: () => isFeatureEnabled("houseKeepingCron") },
);
