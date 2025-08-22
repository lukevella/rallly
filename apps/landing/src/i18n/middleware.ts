import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fallbackLng, headerName, languages } from "./settings";

function getLocaleFromPath(pathname: string): string | undefined {
  return languages.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );
}

function removeLocaleFromPath(pathname: string, locale: string): string {
  if (pathname === `/${locale}`) return "/";
  if (pathname.startsWith(`/${locale}/`)) {
    return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function addLocaleToPath(pathname: string, locale: string): string {
  return `/${locale}${pathname}`;
}

function createLocalizedHeaders(req: NextRequest, locale: string): Headers {
  const headers = new Headers(req.headers);
  headers.set(headerName, locale);
  return headers;
}

function shouldRedirectFallbackLocale(pathname: string): boolean {
  return (
    pathname === `/${fallbackLng}` || pathname.startsWith(`/${fallbackLng}/`)
  );
}

export function i18nMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const newUrl = req.nextUrl.clone();

  const localeInPath = getLocaleFromPath(pathname);
  const preferredLocale = getPreferredLocale({
    acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
  });

  // Ensure we always have a valid locale, fallback to fallbackLng if needed
  const locale = localeInPath || preferredLocale || fallbackLng;
  const headers = createLocalizedHeaders(req, locale);

  // If the URL starts with the fallback language prefix, redirect to remove it
  if (shouldRedirectFallbackLocale(pathname)) {
    const pathWithoutFallback = removeLocaleFromPath(pathname, fallbackLng);
    newUrl.pathname = pathWithoutFallback;
    return NextResponse.redirect(newUrl);
  }

  // If no locale in path, handle based on preferred locale
  if (!localeInPath) {
    // If preferred locale is not fallback language, redirect to add locale prefix
    if (preferredLocale !== fallbackLng) {
      newUrl.pathname = addLocaleToPath(pathname, preferredLocale);
      return NextResponse.redirect(newUrl);
    }

    // If preferred locale is fallback language, rewrite internally to include it
    // This keeps the URL clean externally but routes internally to /[locale]/...
    newUrl.pathname = addLocaleToPath(pathname, fallbackLng);
    return NextResponse.rewrite(newUrl, { request: { headers } });
  }

  return NextResponse.next({ request: { headers } });
}
