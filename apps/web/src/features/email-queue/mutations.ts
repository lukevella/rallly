import "server-only";

import type { Prisma } from "@rallly/database";
import { Prisma as PrismaRuntime, prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { Clock, Effect } from "effect";
import type { DatabaseError } from "@/lib/effect/db";
import { fromPrisma } from "@/lib/effect/db";
import {
  MAX_QUEUED_EMAIL_ATTEMPTS,
  QUEUED_EMAIL_CLAIM_TIMEOUT_MS,
  QUEUED_EMAIL_CONCURRENCY,
  QUEUED_EMAIL_KINDS,
  QUEUED_EMAIL_PURGE_CHUNK_SIZE,
  QUEUED_EMAIL_PURGE_MAX_CHUNKS,
  QUEUED_EMAIL_RETENTION_MS,
  QUEUED_EMAIL_RUN_BUDGET_MS,
} from "./constants";
import { listPurgeableQueuedEmailIds, listQueuedEmails } from "./data";
import { QueuedEmailHandlers, SendRateLimiter } from "./service";
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
 * Deletes emails that reached a final state longer ago than the retention
 * period, a chunk at a time so a backlog never becomes one long statement.
 * Deleting a row twice is harmless, so overlapping runs need no locking.
 * A run stops after a fixed number of chunks; the next run continues.
 * Pending emails are never purged.
 */
export const purgeQueuedEmails = Effect.fn("emailQueue.purgeQueuedEmails")(
  function* ({ now }: { now: Date }) {
    const cutoff = new Date(now.getTime() - QUEUED_EMAIL_RETENTION_MS);
    let purged = 0;
    for (let chunk = 0; chunk < QUEUED_EMAIL_PURGE_MAX_CHUNKS; chunk++) {
      const ids = yield* fromPrisma(() =>
        listPurgeableQueuedEmailIds({
          cutoff,
          limit: QUEUED_EMAIL_PURGE_CHUNK_SIZE,
        }),
      );
      if (ids.length === 0) {
        break;
      }
      const { count } = yield* fromPrisma(() =>
        prisma.queuedEmail.deleteMany({ where: { id: { in: ids } } }),
      );
      purged += count;
      if (ids.length < QUEUED_EMAIL_PURGE_CHUNK_SIZE) {
        break;
      }
    }
    return purged;
  },
);

/**
 * Claims a batch of pending emails in one statement. SKIP LOCKED lets
 * overlapping runs claim disjoint batches instead of queueing behind each
 * other, and the attempt is counted at claim time so an email whose send
 * keeps killing the run still exhausts. Only kinds this build has a handler
 * for are claimed: a process on older code, mid upgrade or sharing a dev
 * database, would otherwise spend the attempts of kinds it cannot send.
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
            AND kind::text = ANY(${[...QUEUED_EMAIL_KINDS]})
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

export type QueuedEmailOutcome =
  | "sent"
  | "skipped"
  | "retrying"
  | "failed"
  | "deferred";

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
 * email waits out the claim timeout before a scheduled run tries again. Every write
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
  if (attempts < MAX_QUEUED_EMAIL_ATTEMPTS) {
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

/**
 * Hands an unattempted claim back: the claim is cleared and its attempt
 * uncounted, so the next run takes it at once and it costs no attempt.
 * Conditional on the claim, like every result write.
 */
export const releaseQueuedEmail = Effect.fn("emailQueue.releaseQueuedEmail")(
  function* ({ id, attempts }: { id: string; attempts: number }) {
    yield* fromPrisma(() =>
      prisma.queuedEmail.updateMany({
        where: { id, status: "pending", attempts },
        data: { claimedAt: null, attempts: { decrement: 1 } },
      }),
    );
    return "deferred" satisfies QueuedEmailOutcome as QueuedEmailOutcome;
  },
);

export type DeliverQueuedEmailsSummary = Record<
  QueuedEmailOutcome | "attempted" | "abandoned" | "purged",
  number
>;

/**
 * One run: purge old emails, fail abandoned final attempts, claim a batch,
 * send it a few at a time under the shared send rate and record every
 * outcome. The scheduled
 * run covers every batch; a run triggered by the action that queued the
 * emails is limited to that action's batch so its first emails go out at
 * once. Past the run budget, or when the shared rate has no slot in time,
 * the remaining claims are handed back for the next run.
 */
export const deliverQueuedEmails = Effect.fn("emailQueue.deliverQueuedEmails")(
  function* ({
    now,
    limit,
    batchId,
  }: {
    now: Date;
    limit: number;
    batchId?: string;
  }): Effect.fn.Return<
    DeliverQueuedEmailsSummary,
    DatabaseError,
    QueuedEmailHandlers | SendRateLimiter
  > {
    // Housekeeping: a purge that fails is retried next run, and must not
    // stop this one sending.
    const purged = batchId
      ? 0
      : yield* purgeQueuedEmails({ now }).pipe(
          Effect.catchTag("DatabaseError", (error) =>
            Effect.sync(() => {
              logger.error(
                { error: error.cause },
                "Failed to purge queued emails",
              );
              return 0;
            }),
          ),
        );
    const abandoned = batchId ? 0 : yield* failAbandonedQueuedEmails({ now });
    const ids = yield* claimQueuedEmails({ now, limit, batchId });
    const emails =
      ids.length > 0 ? yield* fromPrisma(() => listQueuedEmails({ ids })) : [];
    const deadline = now.getTime() + QUEUED_EMAIL_RUN_BUDGET_MS;
    const rate = yield* SendRateLimiter;

    const outcomes = yield* Effect.forEach(
      emails,
      Effect.fn("emailQueue.deliverQueuedEmail")(function* (email) {
        const claim = { id: email.id, attempts: email.attempts };
        if ((yield* Clock.currentTimeMillis) > deadline) {
          return yield* releaseQueuedEmail(claim);
        }
        if (!(yield* rate.acquire())) {
          return yield* releaseQueuedEmail(claim);
        }
        const result = yield* attemptQueuedEmail(email);
        return yield* recordQueuedEmailResult({
          ...claim,
          result,
          now: new Date(yield* Clock.currentTimeMillis),
        });
      }),
      { concurrency: QUEUED_EMAIL_CONCURRENCY },
    );

    const summary: DeliverQueuedEmailsSummary = {
      purged,
      abandoned,
      attempted: emails.length,
      sent: 0,
      skipped: 0,
      retrying: 0,
      failed: 0,
      deferred: 0,
    };
    for (const outcome of outcomes) {
      summary[outcome]++;
    }
    return summary;
  },
);
