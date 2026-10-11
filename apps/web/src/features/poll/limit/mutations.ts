import "server-only";

import type { Prisma } from "@rallly/database";
import { isOpenPollLimitEnabled } from "./constants";
import { countOpenPolls } from "./data";
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
