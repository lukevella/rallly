import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await signOut();

  return NextResponse.redirect(new URL("/login", req.url));
}
