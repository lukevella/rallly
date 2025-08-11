import { isSelfHosted } from "@/utils/constants";

export const isBillingEnabled = !isSelfHosted;

// Re-export plan names from the shared billing package
export { PLAN_NAMES } from "@rallly/billing";
