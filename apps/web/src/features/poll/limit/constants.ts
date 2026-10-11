import { isBillingEnabled } from "@/features/billing/constants";
import type { ActivePollTier } from "./types";

// null is unlimited. Read by the server to refuse and by the client to
// explain, so the two can never disagree.
export const ACTIVE_POLL_LIMITS: Record<ActivePollTier, number | null> = {
  guest: 1,
  hobby: 3,
  pro: null,
};

// The ladder exists to sell Pro, so it only applies where there is
// something to buy.
export const isActivePollLimitEnabled =
  isBillingEnabled && process.env.ACTIVE_POLL_LIMIT_ENABLED === "true";
