import { usePostHog as usePostHogHook } from "posthog-js/react";

// Seems silly but annoyingly typescript tries to import usePostHog from
// posthog-js/react/dist/types which doesn't even work.
export const usePostHog = usePostHogHook;
