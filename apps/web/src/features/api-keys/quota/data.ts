import "server-only";

import { prisma } from "@rallly/database";
import type { AuthorizedSpaceId } from "@/features/space/types";
import {
  apiPollTierLimit,
  resolveApiPollLimit,
  startOfNextUtcMonth,
  startOfUtcMonth,
} from "./utils";

async function readApiPollQuota({
  spaceId,
  now,
}: {
  spaceId: string;
  now: Date;
}) {
  const period = startOfUtcMonth(now);

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      name: true,
      apiPollQuotaOverride: true,
      owner: {
        select: {
          email: true,
          locale: true,
          banned: true,
          deletedAt: true,
        },
      },
      subscriptions: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          apiAddonTier: true,
          apiPollRetainedTier: true,
          apiPollRetainedUntil: true,
        },
      },
      apiUsage: {
        where: { resource: "poll", period },
        select: { count: true },
      },
    },
  });

  const subscription = space?.subscriptions[0];
  const addonLimit = apiPollTierLimit(subscription?.apiAddonTier ?? null);
  const retainedLimit = apiPollTierLimit(
    subscription?.apiPollRetainedTier ?? null,
  );
  const retainedUntil = subscription?.apiPollRetainedUntil ?? null;

  return {
    space,
    quota: {
      limit: resolveApiPollLimit({
        addonLimit,
        retainedLimit,
        retainedUntil,
        override: space?.apiPollQuotaOverride ?? null,
        now,
      }),
      used: space?.apiUsage[0]?.count ?? 0,
      resetAt: startOfNextUtcMonth(now),
      addonLimit,
      retainedLimit,
      retainedUntil,
    },
  };
}

export async function getApiPollQuota({
  spaceId,
  now,
}: {
  spaceId: AuthorizedSpaceId;
  now: Date;
}) {
  const { quota } = await readApiPollQuota({ spaceId, now });
  return quota;
}

/**
 * What the quota warning email needs: the space's current quota and its
 * owner. Keyed by the queued email's subject, which the queue wrote itself,
 * so it takes a plain id.
 */
export async function getApiPollQuotaWarningContext({
  spaceId,
  now,
}: {
  spaceId: string;
  now: Date;
}) {
  const { space, quota } = await readApiPollQuota({ spaceId, now });
  if (!space) {
    return null;
  }
  return { spaceName: space.name, owner: space.owner, ...quota };
}
