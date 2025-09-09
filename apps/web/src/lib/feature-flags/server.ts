import "server-only";
import type { Feature } from "@/lib/feature-flags/types";
import { getFeatureFlagConfig } from "./config";

export function isFeatureEnabled(feature: Feature) {
  return getFeatureFlagConfig()[feature];
}
