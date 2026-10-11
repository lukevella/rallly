import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { pollListItemSelect, toPollListItems } from "@/features/poll/data";
import { isOpenPollLimitEnabled } from "./constants";
import type {
  OpenPollLimitDetails,
  OpenPollTier,
  OpenPollUsage,
} from "./types";
import { getOpenPollLimit } from "./utils";

// The organizer is the tenant: the space only narrows which of their polls
// count, so a caller may pass a poll's own space without a session gate.
type OpenPollScope = {
  userId: string;
  /** null scopes to a guest's polls, which have no space */
  spaceId: string | null;
};

// Closed, scheduled, canceled and deleted polls all free a slot.
const openPollsWhere = ({ userId, spaceId }: OpenPollScope) =>
  ({
    userId,
    spaceId,
    status: "open",
    deleted: false,
  }) satisfies Prisma.PollWhereInput;

export function countOpenPolls({
  db = prisma,
  ...scope
}: OpenPollScope & { db?: Prisma.TransactionClient }) {
  return db.poll.count({ where: openPollsWhere(scope) });
}

export async function getOpenPollUsage({
  tier,
  ...scope
}: OpenPollScope & { tier: OpenPollTier }): Promise<OpenPollUsage> {
  return {
    tier,
    limit: getOpenPollLimit({ tier, enabled: isOpenPollLimitEnabled }),
    openCount: await countOpenPolls(scope),
  };
}

export async function listOpenPolls(scope: OpenPollScope) {
  const polls = await prisma.poll.findMany({
    where: openPollsWhere(scope),
    select: pollListItemSelect,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 50,
  });
  return toPollListItems(polls);
}

export async function getOpenPollLimitDetails({
  usage,
  ...scope
}: OpenPollScope & { usage: OpenPollUsage }): Promise<OpenPollLimitDetails> {
  return { usage, polls: await listOpenPolls(scope) };
}
