import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { posthog } from "@/features/analytics/posthog";

export function withPostHog(
  handler: (req: NextRequest) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return (async (req: NextRequest) => {
    const response = await handler(req);
    const ph = posthog();
    if (ph) {
      waitUntil(ph.flush());
    }
    return response;
  }) as (req: NextRequest) => Promise<Response>;
}
