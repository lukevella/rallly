import "server-only";

import { prisma } from "@rallly/database";
import { Effect } from "effect";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { fromPrisma } from "@/lib/effect/db";
import { startOfUtcMonth } from "./utils";

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
        INSERT INTO api_usage (space_id, resource, period, count, updated_at)
        VALUES (${spaceId}, 'poll', ${toPeriodDate(period)}::date, 1, NOW())
        ON CONFLICT (space_id, resource, period) DO UPDATE
        SET count = api_usage.count + 1, updated_at = NOW()
        WHERE ${limit}::int IS NULL OR api_usage.count < ${limit}::int
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
        UPDATE api_usage
        SET count = GREATEST(count - 1, 0), updated_at = NOW()
        WHERE space_id = ${spaceId}
          AND resource = 'poll'
          AND period = ${toPeriodDate(period)}::date
      `,
    );
  },
);
