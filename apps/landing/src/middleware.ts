import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fallbackLng, headerName, languages } from "@/i18n/settings";

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

  // If the URL starts with the fallback language prefix, redirect to remove it
  if (
    pathname === `/${fallbackLng}` ||
    pathname.startsWith(`/${fallbackLng}/`)
  ) {
    const pathWithoutFallback =
      pathname === `/${fallbackLng}`
        ? "/"
        : pathname.slice(fallbackLng.length + 1);
    newUrl.pathname = pathWithoutFallback;
    return NextResponse.redirect(newUrl);
  }

  // If no locale in path, we need to handle this differently:
  if (!localeInPath) {
    // If preferred locale is not fallback language, redirect to add locale prefix
    if (preferredLocale !== fallbackLng) {
      newUrl.pathname = `/${preferredLocale}${pathname}`;
      return NextResponse.redirect(newUrl);
    }

    // If preferred locale is fallback language, rewrite internally to include it
    // This keeps the URL clean externally but routes internally to /[locale]/...
    newUrl.pathname = `/${fallbackLng}${pathname}`;
    return NextResponse.rewrite(newUrl, { request: { headers } });
  }

  return NextResponse.next({ headers });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
