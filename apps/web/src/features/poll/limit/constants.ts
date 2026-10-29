import {
  FREE_OPEN_POLL_LIMIT,
  isBillingEnabled,
} from "@/features/billing/constants";
import type { OpenPollTier } from "./types";

// null is unlimited. Read by the server to refuse and by the client to
// explain, so the two can never disagree.
export const OPEN_POLL_LIMITS: Record<OpenPollTier, number | null> = {
  guest: 1,
  hobby: FREE_OPEN_POLL_LIMIT,
  pro: null,
};

// The ladder exists to sell Pro, so it only applies where there is
// something to buy.
export const isOpenPollLimitEnabled =
  isBillingEnabled && process.env.OPEN_POLL_LIMIT_ENABLED === "true";
