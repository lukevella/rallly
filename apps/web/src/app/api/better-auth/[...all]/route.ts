import { toNextJsHandler } from "better-auth/next-js";
import { withPostHog } from "@/features/analytics/posthog";
import { authLib } from "@/lib/auth";

const { POST: authPost, GET: authGet } = toNextJsHandler(authLib);

export const POST = withPostHog(authPost);
export const GET = withPostHog(authGet);
