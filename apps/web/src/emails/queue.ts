import "server-only";

import { createLogger } from "@rallly/logger";
import { Effect, Layer } from "effect";
import { after } from "next/server";
import {
  QUEUED_EMAIL_BATCH_SIZE,
  QUEUED_EMAIL_IMMEDIATE_BATCH_SIZE,
} from "@/features/email-queue/constants";
import { deliverQueuedEmails } from "@/features/email-queue/mutations";
import {
  QueuedEmailHandlers,
  SendRateLimiter,
} from "@/features/email-queue/service";
import { sendScheduledEventInviteEmail } from "@/features/scheduled-event/mutations";
import { runtime } from "@/lib/effect/runtime";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

const logger = createLogger("email-queue");

/**
 * Every kind's handler. Built here, outside the features, because the
 * features that queue email depend on the queue; the queue depending back
 * on them would be a cycle.
 */
const queuedEmailLayer = Layer.mergeAll(
  Layer.succeed(
    QueuedEmailHandlers,
    QueuedEmailHandlers.of({
      scheduled_event_invite: sendScheduledEventInviteEmail,
    }),
  ),
  SendRateLimiter.layer,
);

/**
 * One delivery run. The scheduled run claims a full batch across every
 * action; a run for one action's batch claims only its immediate share.
 */
export function runQueuedEmailDelivery({
  batchId,
  limit = batchId ? QUEUED_EMAIL_IMMEDIATE_BATCH_SIZE : QUEUED_EMAIL_BATCH_SIZE,
}: {
  batchId?: string;
  limit?: number;
}) {
  return runtime.runPromise(
    deliverQueuedEmails({ now: new Date(), limit, batchId }).pipe(
      Effect.provide(queuedEmailLayer),
    ),
  );
}

/**
 * Sends the first emails an action queued once its response is out, so a
 * typical fan-out lands within seconds. Where the house-keeping cron runs,
 * it drains whatever is left at its own pace. Without it, this run stands
 * in for the cron: it covers every batch and keeps going until the queue is
 * empty, so it also recovers claims an earlier run abandoned. Needs a
 * request scope for `after`.
 */
export function scheduleQueuedEmailDelivery({ batchId }: { batchId: string }) {
  const drain = !isFeatureEnabled("houseKeepingCron");
  after(async () => {
    try {
      for (;;) {
        const summary = await runQueuedEmailDelivery({
          batchId: drain ? undefined : batchId,
        });
        // Without the cron nothing else will pick up the rest, including
        // claims a run handed back when its budget ran out.
        if (
          !drain ||
          (summary.attempted < QUEUED_EMAIL_BATCH_SIZE &&
            summary.deferred === 0)
        ) {
          return;
        }
      }
    } catch (error) {
      logger.error({ batchId, error }, "Queued email delivery failed");
    }
  });
}
