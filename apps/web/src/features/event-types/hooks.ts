"use client";

import { useFeatureFlag } from "@/lib/feature-flags/client";

export function useEventTypesEnabled() {
  return useFeatureFlag("eventTypes");
}
