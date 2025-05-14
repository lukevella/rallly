import { rateLimit } from "@/features/rate-limit";
import { handlers } from "@/next-auth";
import { withPosthog } from "@/utils/posthog";
import type { NextRequest } from "next/server";

export const GET = withPosthog(async (req: NextRequest) => {
  if (req.nextUrl.pathname.includes("callback/email")) {
    const { success } = await rateLimit("login_otp_attempt", 20, "15m");

    if (!success) {
      return new Response("Too many requests", {
        status: 429,
      });
    }
  }

  return handlers.GET(req);
});

export const POST = withPosthog(handlers.POST);
