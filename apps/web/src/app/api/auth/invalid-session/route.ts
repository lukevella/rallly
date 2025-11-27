import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { signOut as legacySignOut } from "@/next-auth";

export async function GET(req: NextRequest) {
  try {
    await legacySignOut();
  } catch (error) {
    console.error("FAILED TO SIGN OUT", error);
  }

  return NextResponse.redirect(new URL("/login", req.url));
}
