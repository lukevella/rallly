import { PostHog } from "@rallly/posthog/server";
import { env } from "@/env";

let instance: PostHog | undefined;

export function posthog() {
  if (!instance && env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    instance = new PostHog(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
      flushAt: 20,
      flushInterval: 10000,
    });
  }

  return instance;
}
