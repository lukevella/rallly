import { defaultLocale, supportedLngs } from "@rallly/languages";
import { getPreferredLocaleFromHeaders } from "@rallly/languages/get-preferred-locale";
import type { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";

// Read via process.env to keep `@/env` out of the middleware bundle —
// t3-env validates eagerly on import and would crash server boot on any
// misconfigured server var. Shape is still validated in `@/env`.
const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

export function getLocaleFromRequest(req: NextRequest) {
  const localeCookie = req.cookies.get(LOCALE_COOKIE_NAME);
  if (localeCookie && supportedLngs.includes(localeCookie.value)) {
    return localeCookie.value;
  }

  const acceptLanguageHeader = req.headers.get("accept-language");

  if (acceptLanguageHeader) {
    return getPreferredLocaleFromHeaders({
      acceptLanguageHeader,
    });
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
