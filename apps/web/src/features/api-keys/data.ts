import "server-only";

import { prisma } from "@rallly/database";
import { cache } from "react";
import { getActiveSpaceForUser } from "@/features/space/data";
import type { SpaceTier } from "@/features/space/schema";
import { getCurrentUser } from "@/features/user/data";
import { isSelfHosted } from "@/lib/constants";
import { posthog } from "@/lib/posthog";

/**
 * Resolve the current user's space and verify API access. Auth is enforced
 * here in the DAL so no call site can fetch API keys without the gate.
 * Failures are returned as values; stale sessions still throw
 * InvalidSessionError from getCurrentUser for the boundary to handle.
 */
export const getApiKeyAccessContext = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, reason: "unauthorized" } as const;
  }

  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    return { ok: false, reason: "no_active_space" } as const;
  }

  if (!(await isApiAccessEnabled(user, space))) {
    return { ok: false, reason: "api_access_not_enabled" } as const;
  }

  return { ok: true, user, space } as const;
});

export const getSpaceApiKeys = cache(async () => {
  const context = await getApiKeyAccessContext();

  if (!context.ok) {
    return context;
  }

  const apiKeys = await prisma.spaceApiKey.findMany({
    where: {
      spaceId: context.space.id,
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

  return { ok: true, apiKeys } as const;
});

/**
 * Determines if a user has access to API features (API keys, developer tools)
 * @param user - The user to check access for
 * @param space - The space to check access for
 * @returns True if the user can access API features
 */
async function isApiAccessEnabled(
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
