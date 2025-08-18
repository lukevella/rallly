import { supportedLngs } from "@rallly/languages";
import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fallbackLng, headerName, languages } from "@/i18n/settings";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const localeInPath = supportedLngs.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  let lng;
  // If no cookie, check the Accept-Language header
  if (!lng)
    lng = getPreferredLocale({
      acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
    });
  // Default to fallback language if still undefined
  if (!lng) lng = fallbackLng;

  // Check if the language is already in the path
  const lngInPath = languages.find((loc) =>
    req.nextUrl.pathname.startsWith(`/${loc}`),
  );
  const headers = new Headers(req.headers);
  headers.set(headerName, lngInPath || lng);

  // If the language is not in the path, redirect to include it
  if (!lngInPath) {
    return NextResponse.redirect(
      new URL(`/${lng}${req.nextUrl.pathname}${req.nextUrl.search}`, req.url),
    );
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
