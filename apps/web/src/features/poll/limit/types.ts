import type { PollListItem } from "@/features/poll/types";
import type { SpaceTier } from "@/features/space/schema";

export type OpenPollTier = "guest" | SpaceTier;

export type OpenPollUsage = {
  tier: OpenPollTier;
  /** null when the tier is unlimited or enforcement is off */
  limit: number | null;
  openCount: number;
};

/** What the limit dialog shows: the count and the polls holding the slots */
export type OpenPollLimitDetails = {
  usage: OpenPollUsage;
  polls: PollListItem[];
};
