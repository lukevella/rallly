import "server-only";

import { prisma } from "@rallly/database";
import type { SpaceTier } from "@/features/space/schema";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { isSelfHosted } from "@/lib/constants";
import { posthog } from "@/lib/posthog";

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
 * Determines if a user has access to API features (API keys, developer tools)
 * @param user - The user to check access for
 * @param space - The space to check access for
 * @returns True if the user can access API features
 */
export async function isApiAccessEnabled(
  user: {
    id: string;
  },
  space: {
    tier: SpaceTier;
    ownerId: string;
  },
): Promise<boolean> {
  // Block self-hosted deployments
  if (isSelfHosted) {
    return false;
  }

  // Require pro tier
  if (space.tier !== "pro") {
    return false;
  }

  // Require space owner
  if (space.ownerId !== user.id) {
    return false;
  }

  // Check PostHog feature flag
  const isFeatureFlagEnabled = await posthog()?.isFeatureEnabled(
    "developer-tools",
    user.id,
  );

  return isFeatureFlagEnabled ?? false;
}
