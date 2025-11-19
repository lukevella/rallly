import { PostHog } from "@rallly/posthog/server";
import { env } from "@/env";

export function PostHogClient() {
  if (!env.NEXT_PUBLIC_POSTHOG_API_KEY) return null;

  return new PostHog(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
    flushAt: 20,
    flushInterval: 10000,
  });
}
