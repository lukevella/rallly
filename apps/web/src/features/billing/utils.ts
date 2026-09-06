import { isBillingEnabled } from "@/features/billing/constants";
import type { SpaceTier } from "@/features/space/schema";

/**
 * The tier a space's paid features are gated on. Without billing there is
 * nothing to pay for, so every space has every paid feature regardless of
 * what the row says. This is the only place that rule is derived.
 */
export function resolveSpaceTier(storedTier: SpaceTier): SpaceTier {
  return isBillingEnabled ? storedTier : "pro";
}
