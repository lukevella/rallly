import "server-only";
import { env } from "@/env";
import { isBillingEnabled } from "@/features/billing/constants";
import { isFeedbackEnabled } from "@/features/feedback/constants";
import type { FeatureFlagConfig } from "@/lib/feature-flags/types";
import { isStorageEnabled } from "@/lib/storage";

export const featureFlagConfig = (): FeatureFlagConfig => {
  const isEmailLoginEnabled = env.EMAIL_LOGIN_ENABLED !== "false";
  const isRegistrationEnabled = env.REGISTRATION_ENABLED !== "false";

  return {
    storage: isStorageEnabled,
    billing: isBillingEnabled,
    feedback: isFeedbackEnabled,
    emailLogin: isEmailLoginEnabled,
    registration: isEmailLoginEnabled && isRegistrationEnabled,
  };
};
