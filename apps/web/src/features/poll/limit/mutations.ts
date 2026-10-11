import "server-only";

import type { Prisma } from "@rallly/database";
import { isActivePollLimitEnabled } from "./constants";
import { countActivePolls } from "./data";
import type { ActivePollUsage } from "./types";
import {
  getActivePollLimit,
  getActivePollTier,
  isAtActivePollLimit,
} from "./utils";

export class ActivePollLimitError extends Error {
  readonly _tag = "ActivePollLimitError";
  constructor(readonly usage: ActivePollUsage) {
    super("Active poll limit reached");
  }
}

/**
 * Whether the organizer can open one more poll in this scope. Call it inside
 * the transaction that opens the poll: it takes a lock held until that
 * transaction ends, so two concurrent creates can't both see the last slot.
 */
export async function checkActivePollCapacity(
  tx: Prisma.TransactionClient,
  { userId, spaceId }: { userId: string; spaceId: string | null },
): Promise<{ ok: true } | { ok: false; usage: ActivePollUsage }> {
  if (!isActivePollLimitEnabled) {
    return { ok: true };
  }

  const space = spaceId
    ? await tx.space.findUnique({
        where: { id: spaceId },
        select: { tier: true },
      })
    : null;
  const tier = getActivePollTier(space?.tier ?? null);
  const limit = getActivePollLimit({ tier, enabled: true });

  if (limit === null) {
    return { ok: true };
  }

  // $executeRaw because Prisma can't deserialize the void the lock returns.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`active_polls:${userId}:${spaceId ?? ""}`}))`;

  const usage: ActivePollUsage = {
    tier,
    limit,
    activeCount: await countActivePolls({ db: tx, userId, spaceId }),
  };

  return isAtActivePollLimit(usage) ? { ok: false, usage } : { ok: true };
}

/** Throws so the transaction that would open the poll rolls back. */
export async function assertActivePollCapacity(
  tx: Prisma.TransactionClient,
  scope: { userId: string; spaceId: string | null },
) {
  const capacity = await checkActivePollCapacity(tx, scope);
  if (!capacity.ok) {
    throw new ActivePollLimitError(capacity.usage);
  }
}
