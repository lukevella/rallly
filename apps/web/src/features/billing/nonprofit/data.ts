import "server-only";

import { prisma } from "@rallly/database";
import type { NonprofitStatus } from "@/features/billing/nonprofit/types";
import type { AuthorizedSpaceId } from "@/features/space/types";

export async function getNonprofitStatus(
  spaceId: AuthorizedSpaceId,
): Promise<NonprofitStatus> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      nonprofitDiscountGrantedAt: true,
      nonprofitApplications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, reason: true },
      },
    },
  });

  const latest = space?.nonprofitApplications[0];

  return {
    grantedAt: space?.nonprofitDiscountGrantedAt ?? null,
    latestApplication: latest
      ? { status: latest.status, reason: latest.reason }
      : null,
  };
}
