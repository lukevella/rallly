import { waitUntil } from "@vercel/functions";
import { toNextJsHandler } from "better-auth/next-js";
import { PostHogClient } from "@/features/analytics/posthog";
import { authLib } from "@/lib/auth";

const { POST: authPost, GET: authGet } = toNextJsHandler(authLib);

function withPostHogFlush(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req) => {
    const response = await handler(req);
    const posthog = PostHogClient();
    if (posthog) {
      waitUntil(posthog.flush());
    }
    return response;
  };
}

export const POST = withPostHogFlush(authPost);
export const GET = withPostHogFlush(authGet);
