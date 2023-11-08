import { NextRequest, NextResponse } from "next/server";

import { initGuest } from "@/app/guest";

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect");
  const res = NextResponse.redirect(new URL(redirect ?? "/", req.url));
  await initGuest(req, res, { force: true });
  return res;
}
