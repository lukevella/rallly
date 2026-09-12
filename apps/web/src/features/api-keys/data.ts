import "server-only";

import { prisma } from "@rallly/database";
import type { SpaceTier } from "@/features/space/schema";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

export function getSpaceApiKeys({ spaceId }: { spaceId: AuthorizedSpaceId }) {
  return prisma.spaceApiKey.findMany({
    where: {
      spaceId,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      revokedAt: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * API access is a Pro capability of cloud hosted spaces, managed by the
 * space owner.
 */
export function isApiAccessEnabled(
  user: {
    id: string;
  },
  space: {
    tier: SpaceTier;
    ownerId: string;
  },
) {
  if (!isFeatureEnabled("api")) {
    return false;
  }

  if (space.tier !== "pro") {
    return false;
  }

  return space.ownerId === user.id;
}
