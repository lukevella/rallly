import type { FeatureFlagConfig } from "@/lib/feature-flags/types";
import { isStorageEnabled } from "@/lib/storage";
import { isSelfHosted } from "@/utils/constants";

export const featureFlagConfig: FeatureFlagConfig = {
  storage: isStorageEnabled,
  billing: !isSelfHosted,
};
