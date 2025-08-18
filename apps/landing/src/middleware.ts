import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headerName, languages } from "@/i18n/settings";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const newUrl = req.nextUrl.clone();

  // Check if the language is already in the path
  const localeInPath = languages.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );

  const preferredLocale = getPreferredLocale({
    acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
  });

  const locale = localeInPath || preferredLocale;

  const headers = new Headers(req.headers);
  headers.set(headerName, locale);

  if (!localeInPath) {
    newUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
