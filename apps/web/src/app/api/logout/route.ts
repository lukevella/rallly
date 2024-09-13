import { NextRequest, NextResponse } from "next/server";

import { resetUser } from "@/app/guest";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: 1 });
  await resetUser(req, res);
  return res;
}
