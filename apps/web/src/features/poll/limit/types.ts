import type { SpaceTier } from "@/features/space/schema";

export type ActivePollTier = "guest" | SpaceTier;

export type ActivePollUsage = {
  tier: ActivePollTier;
  /** null when the tier is unlimited or enforcement is off */
  limit: number | null;
  activeCount: number;
};
