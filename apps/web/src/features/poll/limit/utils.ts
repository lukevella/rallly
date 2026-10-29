import { resolveSpaceTier } from "@/features/billing/utils";
import type { SpaceTier } from "@/features/space/schema";
import { OPEN_POLL_LIMITS } from "./constants";
import type { OpenPollTier, OpenPollUsage } from "./types";

/**
 * A poll outside any space belongs to a guest: registered organizers always
 * create into a space, and guest polls only gain one when adopted on sign up.
 */
export function getOpenPollTier(spaceTier: SpaceTier | null): OpenPollTier {
  return spaceTier ? resolveSpaceTier(spaceTier) : "guest";
}

export function getOpenPollLimit({
  tier,
  enabled,
}: {
  tier: OpenPollTier;
  enabled: boolean;
}) {
  return enabled ? OPEN_POLL_LIMITS[tier] : null;
}

/**
 * Adopting guest polls on sign up is never blocked, so an organizer can be
 * over the limit, not just at it.
 */
export function isAtOpenPollLimit({ limit, openCount }: OpenPollUsage) {
  return limit !== null && openCount >= limit;
}

/**
 * One poll short of the limit or beyond it: the point where usage is worth
 * showing. Below that a meter is noise for most free organizers.
 */
export function isNearOpenPollLimit({ limit, openCount }: OpenPollUsage) {
  return limit !== null && openCount >= limit - 1;
}
