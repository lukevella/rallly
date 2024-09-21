import { supportedLngs } from "@rallly/languages";
import languageParser from "accept-language-parser";
import { NextRequest, NextResponse } from "next/server";
// Get the preferred locale, similar to the above or using a library

export async function getLocaleFromHeader(req: NextRequest) {
  // Check if locale is specified in header
  const headers = req.headers;
  const acceptLanguageHeader = headers.get("accept-language");
  const localeFromHeader = acceptLanguageHeader
    ? languageParser.pick(supportedLngs, acceptLanguageHeader)
    : null;
  return localeFromHeader ?? "en";
}

export async function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = supportedLngs.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = await getLocaleFromHeader(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next).*)",
    // Optional: only run on root (/) URL
    // '/'
  ],
};
