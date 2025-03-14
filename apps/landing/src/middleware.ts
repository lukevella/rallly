import { supportedLngs } from "@rallly/languages";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";

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

  const locale = await getPreferredLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  if (locale === "en") {
    return NextResponse.rewrite(request.nextUrl);
  }

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
