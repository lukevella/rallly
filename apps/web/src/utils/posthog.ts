import { usePostHog as usePostHogHook } from "posthog-js/react";

export const usePostHog = () => {
  const posthog = usePostHogHook();
  return process.env.NEXT_PUBLIC_POSTHOG_API_KEY ? posthog : null;
};
