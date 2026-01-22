import { createLogger } from "@rallly/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import auth from "@/lib/auth";
import { signOut as legacySignOut } from "@/next-auth";

const logger = createLogger("api/auth/invalid-session");

export async function GET(req: NextRequest) {
  try {
    await Promise.all([
      legacySignOut({
        redirect: false,
      }),
      auth.api.signOut({
        headers: req.headers,
      }),
    ]);
  } catch (error) {
    logger.error({ error }, "Failed to sign out");
  }

  return NextResponse.redirect(new URL("/login", req.url));
}
