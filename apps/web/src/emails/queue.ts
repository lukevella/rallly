import "server-only";

import { createLogger } from "@rallly/logger";
import { Effect, Layer } from "effect";
import { after } from "next/server";
import { env } from "@/env";
import {
  QUEUED_EMAIL_BATCH_SIZE,
  QUEUED_EMAIL_IMMEDIATE_BATCH_SIZE,
} from "@/features/email-queue/constants";
import { deliverQueuedEmails } from "@/features/email-queue/mutations";
import {
  QueuedEmailHandlers,
  SendRateLimiter,
} from "@/features/email-queue/service";
import { sendReviewRequest } from "@/features/review-request/mutations";
import { sendScheduledEventInviteEmail } from "@/features/scheduled-event/mutations";
import { runtime } from "@/lib/effect/runtime";

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
      review_request: sendReviewRequest,
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
 * typical fan-out lands within seconds. The rest, and any retry, is left to
 * the scheduled runs. Needs a request scope for `after`.
 */
export function scheduleQueuedEmailDelivery({ batchId }: { batchId: string }) {
  after(async () => {
    try {
      await runQueuedEmailDelivery({ batchId });
    } catch (error) {
      logger.error({ batchId, error }, "Queued email delivery failed");
    }
  });
}

const SCHEDULER_INTERVAL_MS = 60_000;

const schedulerState = globalThis as typeof globalThis & {
  queuedEmailScheduler?: ReturnType<typeof setInterval>;
};

/**
 * Runs the queue every minute inside this server process, the same run the
 * house-keeping cron triggers on Vercel. For long-lived servers only: `next
 * dev` and the self-hosted image. A tick that finds the previous run still
 * going is skipped, and the timer is kept on `globalThis` so a dev reload
 * cannot start a second one. Several processes can each run one; claims do
 * not overlap.
 */
export function startQueuedEmailScheduler() {
  if (
    env.EMAIL_QUEUE_SCHEDULER_ENABLED === "false" ||
    schedulerState.queuedEmailScheduler
  ) {
    return;
  }

  let running = false;
  const timer = setInterval(async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      const summary = await runQueuedEmailDelivery({});
      if (
        summary.attempted > 0 ||
        summary.abandoned > 0 ||
        summary.purged > 0
      ) {
        logger.info(summary, "Sent queued emails");
      }
    } catch (error) {
      logger.error({ error }, "Scheduled queued email delivery failed");
    } finally {
      running = false;
    }
  }, SCHEDULER_INTERVAL_MS);
  timer.unref();
  schedulerState.queuedEmailScheduler = timer;
}
