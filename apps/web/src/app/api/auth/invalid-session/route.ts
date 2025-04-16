import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { signOut } from "@/next-auth";

export async function GET(req: NextRequest) {
  await signOut({
    redirect: false,
  });

  return NextResponse.redirect(new URL("/login", req.url));
}
