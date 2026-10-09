import { isSelfHosted } from "@/lib/constants";

// Billing is Stripe on cloud; self-hosted is licensed at instance level
export const isBillingEnabled = !isSelfHosted;

// Import from /pricing, not the package root: the root re-exports the
// Stripe SDK and this file is reachable from client components.
export { PLAN_NAMES } from "@rallly/billing/pricing";

// Flash set by /api/stripe/return after a portal flow; value is the flow name.
export const BILLING_FLASH_KEY = "billing";

export const CANCELLATION_COMMENT_MAX_LENGTH = 500;
