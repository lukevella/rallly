import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { PostHog } from "posthog-node";

function PostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_API_KEY) return null;

  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}

export const posthog = PostHogClient();

export function withPosthog(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    const res = await handler(req);
    try {
      waitUntil(Promise.all([posthog?.shutdown()]));
    } catch (error) {
      console.error("Failed to flush PostHog events:", error);
    }
    return res;
  };
}
