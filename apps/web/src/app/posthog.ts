import { PostHog } from "posthog-node";

export function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_API_KEY) return null;

  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
