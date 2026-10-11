import { resolveSpaceTier } from "@/features/billing/utils";
import type { SpaceTier } from "@/features/space/schema";
import { ACTIVE_POLL_LIMITS } from "./constants";
import type { ActivePollTier, ActivePollUsage } from "./types";

/**
 * A poll outside any space belongs to a guest: registered organizers always
 * create into a space, and guest polls only gain one when adopted on sign up.
 */
export function getActivePollTier(spaceTier: SpaceTier | null): ActivePollTier {
  return spaceTier ? resolveSpaceTier(spaceTier) : "guest";
}

export function getActivePollLimit({
  tier,
  enabled,
}: {
  tier: ActivePollTier;
  enabled: boolean;
}) {
  return enabled ? ACTIVE_POLL_LIMITS[tier] : null;
}

/**
 * Adopting guest polls on sign up is never blocked, so an organizer can be
 * over the limit, not just at it.
 */
export function isAtActivePollLimit({ limit, activeCount }: ActivePollUsage) {
  return limit !== null && activeCount >= limit;
}
