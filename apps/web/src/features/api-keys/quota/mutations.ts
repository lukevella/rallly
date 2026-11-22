import "server-only";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { Effect } from "effect";
import { queueEmails } from "@/features/email-queue/mutations";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { fromPrisma } from "@/lib/effect/db";
import { getQuotaWarningLevel, startOfUtcMonth, toMonthKey } from "./utils";

const logger = createLogger("api-poll-quota");

function toPeriodDate(period: Date) {
  return period.toISOString().slice(0, 10);
}

/**
 * Counts one API poll against the space's current month. With a limit, the
 * increment and the check are one statement, so concurrent requests can never
 * take more slots than the limit allows. Without one, it only counts.
 */
export const reserveApiPollSlot = Effect.fn("apiPollQuota.reserveApiPollSlot")(
  function* ({
    spaceId,
    now,
    limit,
  }: {
    spaceId: AuthorizedSpaceId;
    now: Date;
    limit: number | null;
  }) {
    const period = startOfUtcMonth(now);

    if (limit !== null && limit <= 0) {
      return { reserved: false as const, period };
    }

    const rows = yield* fromPrisma(
      () => prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO space_usage (space_id, resource, period, count, updated_at)
        VALUES (${spaceId}, 'api_poll', ${toPeriodDate(period)}::date, 1, NOW())
        ON CONFLICT (space_id, resource, period) DO UPDATE
        SET count = space_usage.count + 1, updated_at = NOW()
        WHERE ${limit}::int IS NULL OR space_usage.count < ${limit}::int
        RETURNING count
      `,
    );

    const row = rows[0];
    if (!row) {
      return { reserved: false as const, period };
    }

    return { reserved: true as const, period, count: row.count };
  },
);

/**
 * Gives back a slot taken for a poll that was never created. Takes the period
 * the slot was reserved in, so a request that straddles a month boundary
 * releases from the month it counted against.
 */
export const releaseApiPollSlot = Effect.fn("apiPollQuota.releaseApiPollSlot")(
  function* ({
    spaceId,
    period,
  }: {
    spaceId: AuthorizedSpaceId;
    period: Date;
  }) {
    yield* fromPrisma(
      () => prisma.$executeRaw`
        UPDATE space_usage
        SET count = GREATEST(count - 1, 0), updated_at = NOW()
        WHERE space_id = ${spaceId}
          AND resource = 'api_poll'
          AND period = ${toPeriodDate(period)}::date
      `,
    );
  },
);

/**
 * Queues the owner's warning when a reservation brings the space to 80% or
 * 100% of its limit, once per level per month. Never throws: it runs after
 * the poll is already created, so a failure here must not fail the request.
 */
export async function queueApiPollQuotaWarning(params: {
  spaceId: AuthorizedSpaceId;
  limit: number;
  count: number;
  now: Date;
}) {
  try {
    await queueApiPollQuotaWarningOrThrow(params);
  } catch (error) {
    logger.error(
      { error, spaceId: params.spaceId },
      "API poll quota warning failed",
    );
  }
}

async function queueApiPollQuotaWarningOrThrow({
  spaceId,
  limit,
  count,
  now,
}: {
  spaceId: AuthorizedSpaceId;
  limit: number;
  count: number;
  now: Date;
}) {
  if (!getQuotaWarningLevel({ count, limit })) {
    return;
  }

  const period = startOfUtcMonth(now);
  const where = { spaceId, resource: "api_poll" as const, period };

  await prisma.$transaction(async (tx) => {
    // Another request can release a slot between this request's reservation
    // and now, so the level comes from the stored count, not the reserved one.
    const usage = await tx.spaceUsage.findUnique({
      where: { spaceId_resource_period: where },
      select: { count: true },
    });
    const level = usage
      ? getQuotaWarningLevel({ count: usage.count, limit })
      : null;
    if (!level) {
      return;
    }
    const subjectId = `${spaceId}:${toMonthKey(period)}:${level}`;

    // Conditional on the column being unset, so concurrent reservations
    // crossing the same level still warn only once.
    const { count: claimed } = await tx.spaceUsage.updateMany({
      where:
        level === "at_limit"
          ? { ...where, atLimitWarnedAt: null }
          : { ...where, nearLimitWarnedAt: null },
      data:
        level === "at_limit"
          ? { atLimitWarnedAt: now }
          : { nearLimitWarnedAt: now },
    });
    if (claimed === 0) {
      return;
    }
    if (level === "at_limit") {
      // A count that drops back below the limit after a released slot must
      // not send a near limit warning after this one.
      await tx.spaceUsage.updateMany({
        where: { ...where, nearLimitWarnedAt: null },
        data: { nearLimitWarnedAt: now },
      });
    }

    const space = await tx.space.findUniqueOrThrow({
      where: { id: spaceId },
      select: { ownerId: true },
    });
    await queueEmails(tx, {
      kind: "api_poll_quota_warning",
      userId: space.ownerId,
      batchId: subjectId,
      subjectIds: [subjectId],
    });
  });
}
