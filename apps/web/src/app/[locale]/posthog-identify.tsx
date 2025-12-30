"use client";
import { usePostHog } from "@rallly/posthog/client";
import useMount from "react-use/lib/useMount";
import { useTheme } from "@/features/theme/client";

export function PostHogIdentify({ distinctId }: { distinctId?: string }) {
  const posthog = usePostHog();
  const { theme } = useTheme();
  useMount(() => {
    if (posthog && distinctId) {
      posthog.identify(distinctId, {
        theme,
      });
    }
  });

  return null;
}
