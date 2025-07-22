import "server-only";
import type { Feature } from "@/lib/feature-flags/types";
import { featureFlagConfig } from "./config";

export function isFeatureEnabled(feature: Feature) {
  return featureFlagConfig[feature];
}
