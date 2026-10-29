import type { SpaceTier } from "@/features/space/schema";

export type OpenPollTier = "guest" | SpaceTier;

export type OpenPollUsage = {
  tier: OpenPollTier;
  /** null when the tier is unlimited or enforcement is off */
  limit: number | null;
  openCount: number;
};
