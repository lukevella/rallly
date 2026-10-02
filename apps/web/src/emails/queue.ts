import "server-only";

import { createLogger } from "@rallly/logger";
import { Effect, Layer } from "effect";
import { after } from "next/server";
import { QUEUED_EMAIL_BATCH_SIZE } from "@/features/email-queue/constants";
import { deliverQueuedEmails } from "@/features/email-queue/mutations";
import { QueuedEmailHandlers } from "@/features/email-queue/service";
import { sendScheduledEventInviteEmail } from "@/features/scheduled-event/mutations";
import { runtime } from "@/lib/effect/runtime";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

const logger = createLogger("email-queue");

/**
 * Every kind's handler. Built here, outside the features, because the
 * features that queue email depend on the queue; the queue depending back
 * on them would be a cycle.
 */
const queuedEmailHandlers = Layer.succeed(
  QueuedEmailHandlers,
  QueuedEmailHandlers.of({
    scheduled_event_invite: sendScheduledEventInviteEmail,
  }),
);

/** One delivery run, for the house-keeping cron or a request's `after`. */
export function runQueuedEmailDelivery({ batchId }: { batchId?: string }) {
  return runtime.runPromise(
    deliverQueuedEmails({ now: new Date(), batchId }).pipe(
      Effect.provide(queuedEmailHandlers),
    ),
  );
}

/**
 * Sends the first batch an action queued once its response is out, so a
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
        if (!drain || summary.attempted < QUEUED_EMAIL_BATCH_SIZE) {
          return;
        }
      }
    } catch (error) {
      logger.error({ batchId, error }, "Queued email delivery failed");
    }
  });
}
