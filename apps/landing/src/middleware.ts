import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fallbackLng, headerName, languages } from "@/i18n/settings";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check if the language is already in the path
  const localeInPath = languages.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );
  const preferredLocale = getPreferredLocale({
    acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
  });

  const headers = new Headers(req.headers);
  headers.set(headerName, localeInPath || preferredLocale);

  // If the language is not in the path, redirect to include it
  if (!localeInPath) {
    const newUrl = new URL(
      `/${preferredLocale}${req.nextUrl.pathname}${req.nextUrl.search}`,
      req.url,
    );
    if (preferredLocale === fallbackLng) {
      return NextResponse.rewrite(newUrl);
    }
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
