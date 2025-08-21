import { isBillingEnabled } from "@/features/billing/constants";
import { isFeedbackEnabled } from "@/features/feedback/constants";
import type { FeatureFlagConfig } from "@/lib/feature-flags/types";
import { isStorageEnabled } from "@/lib/storage";

export const featureFlagConfig: FeatureFlagConfig = {
  storage: isStorageEnabled,
  billing: isBillingEnabled,
  feedback: isFeedbackEnabled,
};
