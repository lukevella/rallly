import { posthog } from "@rallly/posthog/server";
import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";

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
