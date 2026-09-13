import { defaultLocale, supportedLngs } from "@rallly/languages";
import { getPreferredLocaleFromHeaders } from "@rallly/languages/get-preferred-locale";
import type { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";

// Read via process.env to keep `@/env` out of the middleware bundle —
// t3-env validates eagerly on import and would crash server boot on any
// misconfigured server var. Shape is still validated in `@/env`.
const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

// The proxy runs on the edge with a NextRequest, where next/headers is
// unavailable; everywhere else uses getLocale() from @/i18n/server/get-locale.
export function getLocaleFromRequest(req: NextRequest) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && supportedLngs.includes(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguageHeader = req.headers.get("accept-language");
  if (acceptLanguageHeader) {
    return getPreferredLocaleFromHeaders({ acceptLanguageHeader });
  }

  return defaultLocale;
}

export function setLocaleCookie(
  _req: NextRequest,
  res: NextResponse,
  locale: string,
) {
  res.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    domain: cookieDomain,
  });
}
