import "server-only";

import type { Prisma } from "@rallly/database";
import { Prisma as PrismaRuntime, prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { Clock, Effect } from "effect";
import type { DatabaseError } from "@/lib/effect/db";
import { fromPrisma } from "@/lib/effect/db";
import {
  MAX_QUEUED_EMAIL_ATTEMPTS,
  QUEUED_EMAIL_BATCH_SIZE,
  QUEUED_EMAIL_CLAIM_TIMEOUT_MS,
  QUEUED_EMAIL_CONCURRENCY,
} from "./constants";
import { listQueuedEmails } from "./data";
import { QueuedEmailHandlers, RetryQueuedEmails } from "./service";
import type { QueuedEmailKind } from "./types";

const logger = createLogger("email-queue");

/**
 * Queues one email per subject inside the caller's transaction, so the
 * emails exist exactly when the change they announce does.
 */
export async function queueEmails(
  tx: Prisma.TransactionClient,
  {
    kind,
    userId,
    batchId,
    subjectIds,
  }: {
    kind: QueuedEmailKind;
    userId: string;
    batchId: string;
    subjectIds: string[];
  },
) {
  if (subjectIds.length === 0) {
    return;
  }
  await tx.queuedEmail.createMany({
    data: subjectIds.map((subjectId) => ({
      kind,
      userId,
      batchId,
      subjectId,
    })),
  });
}

/**
 * Pending emails whose final attempt was claimed by a run that never
 * recorded an outcome. Every other exhausted email is marked failed when
 * its last attempt fails.
 */
export const failAbandonedQueuedEmails = Effect.fn(
  "emailQueue.failAbandonedQueuedEmails",
)(function* ({ now }: { now: Date }) {
  const { count } = yield* fromPrisma(() =>
    prisma.queuedEmail.updateMany({
      where: {
        status: "pending",
        attempts: { gte: MAX_QUEUED_EMAIL_ATTEMPTS },
        claimedAt: {
          lt: new Date(now.getTime() - QUEUED_EMAIL_CLAIM_TIMEOUT_MS),
        },
      },
      data: {
        status: "failed",
        claimedAt: null,
        lastError: "Delivery run did not finish",
      },
    }),
  );
  return count;
});

/**
 * Claims a batch of pending emails in one statement. SKIP LOCKED lets
 * overlapping runs claim disjoint batches instead of queueing behind each
 * other, and the attempt is counted at claim time so an email whose send
 * keeps killing the run still exhausts.
 */
export const claimQueuedEmails = Effect.fn("emailQueue.claimQueuedEmails")(
  function* ({
    now,
    limit,
    batchId,
  }: {
    now: Date;
    limit: number;
    batchId?: string;
  }) {
    const staleBefore = new Date(now.getTime() - QUEUED_EMAIL_CLAIM_TIMEOUT_MS);
    const rows = yield* fromPrisma(
      () => prisma.$queryRaw<{ id: string }[]>`
        UPDATE queued_emails
        SET claimed_at = ${now},
            attempts = attempts + 1,
            updated_at = ${now}
        WHERE id IN (
          SELECT id FROM queued_emails
          WHERE status = 'pending'
            AND attempts < ${MAX_QUEUED_EMAIL_ATTEMPTS}
            AND (claimed_at IS NULL OR claimed_at < ${staleBefore})
            ${batchId ? PrismaRuntime.sql`AND batch_id = ${batchId}` : PrismaRuntime.empty}
          ORDER BY created_at, id
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id`,
    );
    return rows.map((row) => row.id);
  },
);

type QueuedEmail = Awaited<ReturnType<typeof listQueuedEmails>>[number];

type QueuedEmailAttempt =
  | { ok: true }
  | { ok: false; skip: true; reason: string }
  | { ok: false; skip: false; error: string };

export type QueuedEmailOutcome = "sent" | "skipped" | "retrying" | "failed";

/**
 * Hands one claimed email to its kind's handler. An email queued by an
 * account banned since is skipped without building it. A failure is data
 * here: the email is claimed, and an error escaping would leave it to the
 * claim timeout.
 */
export const attemptQueuedEmail = Effect.fn("emailQueue.attemptQueuedEmail")(
  function* (email: QueuedEmail) {
    if (email.user.banned) {
      return {
        ok: false,
        skip: true,
        reason: "Queued by a banned account",
      } satisfies QueuedEmailAttempt as QueuedEmailAttempt;
    }
    const handlers = yield* QueuedEmailHandlers;
    yield* handlers[email.kind]({ id: email.id, subjectId: email.subjectId });
    return { ok: true } satisfies QueuedEmailAttempt as QueuedEmailAttempt;
  },
  Effect.catchTags({
    QueuedEmailSkipped: (error) =>
      Effect.succeed<QueuedEmailAttempt>({
        ok: false,
        skip: true,
        reason: error.reason,
      }),
    QueuedEmailFailed: (error) =>
      Effect.succeed<QueuedEmailAttempt>({
        ok: false,
        skip: false,
        error: error.message,
      }),
  }),
  // A handler that throws (bad stored data reaching Intl, a template bug)
  // fails its own email, not the whole batch it was claimed with.
  Effect.catchDefect((defect) =>
    Effect.succeed<QueuedEmailAttempt>({
      ok: false,
      skip: false,
      error: defect instanceof Error ? defect.message : "Unexpected error",
    }),
  ),
);

/**
 * Records an attempt. A failure with attempts left keeps its claim, so the
 * email waits out the claim timeout before the cron's next try. Every write
 * is conditional on the email still being pending under this claim's
 * attempt, so it cannot undo a skip applied while the send was in flight,
 * nor overwrite a newer claim taken after this one timed out.
 */
export const recordQueuedEmailResult = Effect.fn(
  "emailQueue.recordQueuedEmailResult",
)(function* ({
  id,
  attempts,
  result,
  now,
}: {
  id: string;
  attempts: number;
  result: QueuedEmailAttempt;
  now: Date;
}) {
  const where = { id, status: "pending", attempts } as const;
  if (result.ok) {
    yield* fromPrisma(() =>
      prisma.queuedEmail.updateMany({
        where,
        data: { status: "sent", sentAt: now, claimedAt: null, lastError: null },
      }),
    );
    return "sent" satisfies QueuedEmailOutcome as QueuedEmailOutcome;
  }
  if (result.skip) {
    yield* fromPrisma(() =>
      prisma.queuedEmail.updateMany({
        where,
        data: { status: "skipped", claimedAt: null, lastError: result.reason },
      }),
    );
    return "skipped" satisfies QueuedEmailOutcome as QueuedEmailOutcome;
  }
  logger.warn({ id, attempts, error: result.error }, "Queued email failed");
  if ((yield* RetryQueuedEmails) && attempts < MAX_QUEUED_EMAIL_ATTEMPTS) {
    yield* fromPrisma(() =>
      prisma.queuedEmail.updateMany({
        where,
        data: { lastError: result.error },
      }),
    );
    return "retrying" satisfies QueuedEmailOutcome as QueuedEmailOutcome;
  }
  yield* fromPrisma(() =>
    prisma.queuedEmail.updateMany({
      where,
      data: { status: "failed", claimedAt: null, lastError: result.error },
    }),
  );
  return "failed" satisfies QueuedEmailOutcome as QueuedEmailOutcome;
});

export type DeliverQueuedEmailsSummary = Record<
  QueuedEmailOutcome | "attempted" | "abandoned",
  number
>;

/**
 * One run: fail abandoned final attempts, claim a batch, send it a few at a
 * time and record every outcome. The scheduled run covers every batch; a
 * run triggered by the action that queued the emails is limited to that
 * action's batch so its first emails go out at once.
 */
export const deliverQueuedEmails = Effect.fn("emailQueue.deliverQueuedEmails")(
  function* ({
    now,
    batchId,
  }: {
    now: Date;
    batchId?: string;
  }): Effect.fn.Return<
    DeliverQueuedEmailsSummary,
    DatabaseError,
    QueuedEmailHandlers
  > {
    const abandoned = batchId ? 0 : yield* failAbandonedQueuedEmails({ now });
    const ids = yield* claimQueuedEmails({
      now,
      limit: QUEUED_EMAIL_BATCH_SIZE,
      batchId,
    });
    const emails =
      ids.length > 0 ? yield* fromPrisma(() => listQueuedEmails({ ids })) : [];

    const outcomes = yield* Effect.forEach(
      emails,
      Effect.fn("emailQueue.deliverQueuedEmail")(function* (email) {
        const result = yield* attemptQueuedEmail(email);
        return yield* recordQueuedEmailResult({
          id: email.id,
          attempts: email.attempts,
          result,
          now: new Date(yield* Clock.currentTimeMillis),
        });
      }),
      { concurrency: QUEUED_EMAIL_CONCURRENCY },
    );

    const summary: DeliverQueuedEmailsSummary = {
      abandoned,
      attempted: emails.length,
      sent: 0,
      skipped: 0,
      retrying: 0,
      failed: 0,
    };
    for (const outcome of outcomes) {
      summary[outcome]++;
    }
    return summary;
  },
);
