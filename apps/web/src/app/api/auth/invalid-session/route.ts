import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import auth from "@/lib/auth";
import { signOut as legacySignOut } from "@/next-auth";

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
    console.error("FAILED TO SIGN OUT", error);
  }

  return NextResponse.redirect(new URL("/login", req.url));
}
