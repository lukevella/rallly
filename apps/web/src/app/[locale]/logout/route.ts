import { NextResponse } from "next/server";

import { resetUser } from "@/app/guest";
import { absoluteUrl } from "@/utils/absolute-url";

export async function GET() {
  const res = NextResponse.redirect(absoluteUrl());
  await resetUser(res);
  return res;
}
