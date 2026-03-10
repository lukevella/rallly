import { toNextJsHandler } from "better-auth/next-js";
import { authLib } from "@/lib/auth";
import { withPostHog } from "@/utils/posthog";

const { POST: authPost, GET: authGet } = toNextJsHandler(authLib);

export const POST = withPostHog(authPost);
export const GET = withPostHog(authGet);
