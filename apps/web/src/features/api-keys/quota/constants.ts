import { isBillingEnabled } from "@/features/billing/constants";

// Enforcement starts only when switched on, and only where billing exists
// because the add-on is something to buy.
export const isApiPollQuotaEnabled =
  isBillingEnabled && process.env.API_POLL_QUOTA_ENABLED === "true";

// Share of the monthly limit at which the owner gets the near limit warning.
export const API_POLL_NEAR_LIMIT_RATIO = 0.8;
