"use client";
import { usePostHog } from "@rallly/posthog/client";
import { useTheme } from "@rallly/ui/theme-provider";
import useMount from "react-use/lib/useMount";

export function PostHogIdentify({ distinctId }: { distinctId?: string }) {
  const posthog = usePostHog();
  const { theme } = useTheme();

  useMount(() => {
    if (posthog && distinctId) {
      posthog.identify(distinctId, {
        $set: {
          theme,
        },
      });
    }
  });

  return null;
}
