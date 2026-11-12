import { isBillingEnabled } from "@/features/billing/constants";

// Enforcement starts only when switched on, and only where billing exists
// because the add-on is something to buy.
export const isApiPollQuotaEnabled =
  isBillingEnabled && process.env.API_POLL_QUOTA_ENABLED === "true";
