import { PostHog } from "@rallly/posthog/server";
import type { NextRequest } from "next/server";
import { after } from "next/server";
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

export function withPostHog(
  handler: (req: NextRequest) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } finally {
      const ph = posthog();
      if (ph) {
        after(() => ph.flush());
      }
    }
  };
}
