import { isSelfHosted } from "@/lib/constants";

// Billing is Stripe on cloud; self-hosted is licensed at instance level
export const isBillingEnabled = !isSelfHosted;

// Re-export plan names from the shared billing package
export { PLAN_NAMES } from "@rallly/billing";

// Flash set by /api/stripe/return after a portal flow; value is the flow name.
export const BILLING_FLASH_KEY = "billing";
