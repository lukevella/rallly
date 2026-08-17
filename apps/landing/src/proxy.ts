import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18nMiddleware } from "@/i18n/middleware";
import { headerName } from "@/i18n/settings";
import {
  getCtaExperimentDecision,
  getVariantRewritePath,
} from "@/lib/cta-experiment";

export async function proxy(req: NextRequest) {
  const decision = await getCtaExperimentDecision(req);
  const rewritePath = decision && getVariantRewritePath(decision);

  let res: NextResponse;
  if (decision && rewritePath) {
    const url = req.nextUrl.clone();
    url.pathname = rewritePath;
    const headers = new Headers(req.headers);
    headers.set(headerName, decision.locale);
    res = NextResponse.rewrite(url, { request: { headers } });
  } else {
    res = i18nMiddleware(req);
  }

  for (const cookie of decision?.cookies ?? []) {
    res.cookies.set(cookie.name, cookie.value, {
      maxAge: cookie.maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|poll|.*\\.).*)"],
};
