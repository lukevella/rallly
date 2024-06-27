import { NextResponse } from "next/server";

import { resetUser } from "@/app/guest";
import { absoluteUrl } from "@/utils/absolute-url";

export async function POST() {
  const res = NextResponse.redirect(absoluteUrl("/login"), 302);
  await resetUser(res);
  return res;
}
