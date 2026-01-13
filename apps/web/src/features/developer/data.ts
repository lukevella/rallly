import { PostHogClient } from "@/features/analytics/posthog";
import type { SpaceTier } from "@/features/space/schema";
import { isSelfHosted } from "@/utils/constants";

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
  const posthog = PostHogClient();
  const isFeatureFlagEnabled = await posthog?.isFeatureEnabled(
    "developer-tools",
    user.id,
  );

  return isFeatureFlagEnabled ?? false;
}
