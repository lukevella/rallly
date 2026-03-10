import type { NextRequest } from "next/server";
import { after } from "next/server";
import { posthog } from "@/features/analytics/posthog";

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
