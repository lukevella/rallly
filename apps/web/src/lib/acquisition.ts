import type { NextRequest, NextResponse } from "next/server";

// Landing CTAs append ?ref=<page-slug> because cross-domain referrers don't
// survive the hop from rallly.co to the app. The proxy persists the slug in a
// cookie so it is still available when registration completes requests later
// (signup spans redirects and, for OAuth, a round trip to the provider).
export const REF_COOKIE_NAME = "rallly_ref";

// Which CTA on that page was clicked. Separate from ref so ref keeps meaning
// exactly one thing (the page) — a page has several CTAs and pricing in
// particular has both a free and a paid one, which ref alone cannot tell apart.
export const CTA_COOKIE_NAME = "rallly_cta";

const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Page slugs only (e.g. "home", "blog/is-doodle-still-free") — the param is
// visitor-controlled, so reject anything else before it reaches analytics.
const REF_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,63}$/;

// CTA ids are flat snake_case (e.g. "pricing_pro", "header") — no slashes, so
// they can never be confused with a page slug.
const CTA_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/;

export function parseRefParam(value: string | null | undefined) {
  if (!value || !REF_PATTERN.test(value)) {
    return undefined;
  }
  return value;
}

export function parseCtaParam(value: string | null | undefined) {
  if (!value || !CTA_PATTERN.test(value)) {
    return undefined;
  }
  return value;
}

function setAcquisitionCookie(
  req: NextRequest,
  res: NextResponse,
  name: string,
  value: string,
) {
  res.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: req.nextUrl.protocol === "https:",
    maxAge: REF_COOKIE_MAX_AGE,
  });
}

export function setRefCookie(req: NextRequest, res: NextResponse) {
  const ref = parseRefParam(req.nextUrl.searchParams.get("ref"));
  if (!ref) {
    return;
  }
  setAcquisitionCookie(req, res, REF_COOKIE_NAME, ref);

  // Always rewritten alongside ref so the pair describes one click: a later
  // ref without a cta must clear the previous cta rather than inherit it.
  const cta = parseCtaParam(req.nextUrl.searchParams.get("cta"));
  if (cta) {
    setAcquisitionCookie(req, res, CTA_COOKIE_NAME, cta);
  } else {
    res.cookies.delete(CTA_COOKIE_NAME);
  }
}
