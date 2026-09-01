import type { NextRequest, NextResponse } from "next/server";

// Landing CTAs append ?ref=<page-slug> because cross-domain referrers don't
// survive the hop from rallly.co to the app. The proxy persists the slug in a
// cookie so it is still available when registration completes requests later
// (signup spans redirects and, for OAuth, a round trip to the provider).
export const REF_COOKIE_NAME = "rallly_ref";

const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Page slugs only (e.g. "home", "blog/is-doodle-still-free") — the param is
// visitor-controlled, so reject anything else before it reaches analytics.
const REF_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,63}$/;

export function parseRefParam(value: string | null | undefined) {
  if (!value || !REF_PATTERN.test(value)) {
    return undefined;
  }
  return value;
}

export function setRefCookie(req: NextRequest, res: NextResponse) {
  const ref = parseRefParam(req.nextUrl.searchParams.get("ref"));
  if (!ref) {
    return;
  }
  res.cookies.set(REF_COOKIE_NAME, ref, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: req.nextUrl.protocol === "https:",
    maxAge: REF_COOKIE_MAX_AGE,
  });
}
