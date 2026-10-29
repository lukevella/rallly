import { isSelfHosted } from "@/lib/constants";

// Billing is Stripe on cloud; self-hosted is licensed at instance level
export const isBillingEnabled = !isSelfHosted;

// Import from /pricing, not the package root: the root re-exports the
// Stripe SDK and this file is reachable from client components.
export { PLAN_NAMES } from "@rallly/billing/pricing";

// Flash set by /api/stripe/return after a portal flow; value is the flow name.
export const BILLING_FLASH_KEY = "billing";

// Long enough that the founder's note doesn't arrive alongside the Stripe
// receipt and read as part of it
export const subscriptionFeedbackEmailDelayMs = 30 * 60_000;

export const CANCELLATION_COMMENT_MAX_LENGTH = 500;

// How many polls a free organizer can have open at once in a space. Pro has
// no limit.
export const FREE_OPEN_POLL_LIMIT = 3;
