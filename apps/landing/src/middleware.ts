import { supportedLngs } from "@rallly/languages";
import languageParser from "accept-language-parser";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function getLocaleFromHeader(req: NextRequest) {
  const headers = req.headers;
  const acceptLanguageHeader = headers.get("accept-language");
  const localeFromHeader = acceptLanguageHeader
    ? languageParser.pick(supportedLngs, acceptLanguageHeader)
    : null;
  return localeFromHeader ?? "en";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeInPath = supportedLngs.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (localeInPath) {
    if (localeInPath === "en") {
      // redirect to the same path without the locale
      const newUrl = request.nextUrl.clone();
      newUrl.pathname = pathname.replace(`/${localeInPath}`, "");
      return NextResponse.redirect(newUrl);
    }
    return;
  }

  const locale = await getLocaleFromHeader(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  if (locale === "en") {
    return NextResponse.rewrite(request.nextUrl);
  }

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
