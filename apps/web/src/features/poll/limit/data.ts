import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { isActivePollLimitEnabled } from "./constants";
import type { ActivePollTier, ActivePollUsage } from "./types";
import { getActivePollLimit } from "./utils";

// The organizer is the tenant: the space only narrows which of their polls
// count, so a caller may pass a poll's own space without a session gate.
type ActivePollScope = {
  userId: string;
  /** null scopes to a guest's polls, which have no space */
  spaceId: string | null;
};

// Closed, scheduled, canceled and deleted polls all free a slot.
const activePollsWhere = ({ userId, spaceId }: ActivePollScope) =>
  ({
    userId,
    spaceId,
    status: "open",
    deleted: false,
  }) satisfies Prisma.PollWhereInput;

export function countActivePolls({
  db = prisma,
  ...scope
}: ActivePollScope & { db?: Prisma.TransactionClient }) {
  return db.poll.count({ where: activePollsWhere(scope) });
}

export async function getActivePollUsage({
  tier,
  ...scope
}: ActivePollScope & { tier: ActivePollTier }): Promise<ActivePollUsage> {
  return {
    tier,
    limit: getActivePollLimit({ tier, enabled: isActivePollLimitEnabled }),
    activeCount: await countActivePolls(scope),
  };
}

export function listActivePolls(scope: ActivePollScope) {
  return prisma.poll.findMany({
    where: activePollsWhere(scope),
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
