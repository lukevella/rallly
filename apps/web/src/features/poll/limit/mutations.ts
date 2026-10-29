import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { track } from "@/lib/posthog";
import { isOpenPollLimitEnabled } from "./constants";
import { countOpenPolls, getOpenPollUsage } from "./data";
import type { OpenPollUsage } from "./types";
import { getOpenPollLimit, getOpenPollTier, isAtOpenPollLimit } from "./utils";

export class OpenPollLimitError extends Error {
  readonly _tag = "OpenPollLimitError";
  constructor(readonly usage: OpenPollUsage) {
    super("Open poll limit reached");
  }
}

/**
 * Whether the organizer can open one more poll in this scope. Call it inside
 * the transaction that opens the poll: it takes a lock held until that
 * transaction ends, so two concurrent creates can't both see the last slot.
 */
export async function checkOpenPollCapacity(
  tx: Prisma.TransactionClient,
  { userId, spaceId }: { userId: string; spaceId: string | null },
): Promise<{ ok: true } | { ok: false; usage: OpenPollUsage }> {
  if (!isOpenPollLimitEnabled) {
    return { ok: true };
  }

  const space = spaceId
    ? await tx.space.findUnique({
        where: { id: spaceId },
        select: { tier: true },
      })
    : null;
  const tier = getOpenPollTier(space?.tier ?? null);
  const limit = getOpenPollLimit({ tier, enabled: true });

  if (limit === null) {
    return { ok: true };
  }

  // $executeRaw because Prisma can't deserialize the void the lock returns.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`open_polls:${userId}:${spaceId ?? ""}`}))`;

  const usage: OpenPollUsage = {
    tier,
    limit,
    openCount: await countOpenPolls({ db: tx, userId, spaceId }),
  };

  return isAtOpenPollLimit(usage) ? { ok: false, usage } : { ok: true };
}

/** Throws so the transaction that would open the poll rolls back. */
export async function assertOpenPollCapacity(
  tx: Prisma.TransactionClient,
  scope: { userId: string; spaceId: string | null },
) {
  const capacity = await checkOpenPollCapacity(tx, scope);
  if (!capacity.ok) {
    throw new OpenPollLimitError(capacity.usage);
  }
}

/**
 * Open polls a guest is about to hand over to an account. Read before the
 * hand-over, so `reportAdoptionOverLimit` can tell what it added.
 */
export function countAdoptableOpenPolls(
  where: { userId: string; spaceId: null } | { userId: string },
) {
  if (!isOpenPollLimitEnabled) {
    return Promise.resolve(0);
  }
  return prisma.poll.count({
    where: { ...where, status: "open", deleted: false },
  });
}

/**
 * Adopting guest polls is never blocked, so signing in can leave an
 * organizer over the limit. Reported so the open poll limit's log in
 * loophole (log out, create as a guest, log back in) can be measured.
 * Never throws: it runs inside sign in and setup.
 */
export async function reportAdoptionOverLimit({
  userId,
  spaceId,
  adoptedOpenCount,
  source,
}: {
  userId: string;
  spaceId: string;
  adoptedOpenCount: number;
  source: "login" | "setup";
}) {
  if (!isOpenPollLimitEnabled || adoptedOpenCount === 0) {
    return;
  }

  try {
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      select: { tier: true },
    });
    if (!space) {
      return;
    }

    const usage = await getOpenPollUsage({
      userId,
      spaceId,
      tier: getOpenPollTier(space.tier),
    });
    if (usage.limit === null || usage.openCount <= usage.limit) {
      return;
    }

    track(
      { id: userId, isGuest: false },
      {
        event: "poll_limit:adopted_over_limit",
        properties: {
          tier: usage.tier,
          open_count: usage.openCount,
          limit: usage.limit,
          adopted_open_count: adoptedOpenCount,
          over_by: usage.openCount - usage.limit,
          source,
        },
        groups: { space: spaceId },
      },
    );
  } catch {
    // Reporting only; adoption already succeeded.
  }
}
