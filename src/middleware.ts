import { NextRequest, NextResponse } from "next/server";

const supportedLocales = ["en", "de", "fr"];

export function middleware({ headers, cookies, nextUrl }: NextRequest) {
  const locale =
    cookies.get("NEXT_LOCALE") ??
    (headers
      .get("accept-language")
      ?.split(",")?.[0]
      .split("-")?.[0]
      .toLowerCase() ||
      "en");

  const newUrl = nextUrl.clone();

  if (supportedLocales.includes(locale)) {
    newUrl.pathname = `/${locale}${newUrl.pathname}`;
  }

  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: ["/admin/:id", "/demo", "/p/:id", "/profile", "/new", "/login"],
};
