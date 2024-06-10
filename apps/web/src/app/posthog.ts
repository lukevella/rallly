import { waitUntil } from "@vercel/functions";
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

export function posthogApiHandler() {
  try {
    waitUntil(Promise.all([posthog?.shutdownAsync()]));
  } catch (error) {
    console.error("Failed to flush PostHog events:", error);
  }
}
