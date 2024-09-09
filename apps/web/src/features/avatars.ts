import { useFeatureFlagEnabled } from "posthog-js/react";

export function useAvatarsEnabled() {
  return useFeatureFlagEnabled("avatars");
}
