import { PostHog } from "@rallly/posthog/server";
import { env } from "@/env";

let posthogClient: PostHog | null = null;

export function PostHogClient() {
  if (!env.NEXT_PUBLIC_POSTHOG_API_KEY) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
      flushAt: 20,
      flushInterval: 10000,
    });
  }

  return posthogClient;
}
