import "server-only";

import { prisma } from "@rallly/database";
import type { AuthorizedSpaceId } from "@/features/space/types";
import {
  resolveApiPollLimit,
  startOfNextUtcMonth,
  startOfUtcMonth,
} from "./utils";

export async function getApiPollQuota({
  spaceId,
  now,
}: {
  spaceId: AuthorizedSpaceId;
  now: Date;
}) {
  const period = startOfUtcMonth(now);

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      apiPollQuotaOverride: true,
      subscriptions: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          apiPollLimit: true,
          apiPollRetainedLimit: true,
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
  const addonLimit = subscription?.apiPollLimit ?? null;
  const retainedLimit = subscription?.apiPollRetainedLimit ?? null;
  const retainedUntil = subscription?.apiPollRetainedUntil ?? null;

  return {
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
  };
}
