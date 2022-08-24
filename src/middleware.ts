import languageParser from "accept-language-parser";
import { NextRequest, NextResponse } from "next/server";

const supportedLocales = [
  "en",
  "es",
  "de",
  "fr",
  "it",
  "ko",
  "sv",
  "hu",
  "zh",
  "pt",
  "pt-BR",
];

export function middleware({ headers, cookies, nextUrl }: NextRequest) {
  const newUrl = nextUrl.clone();

  // Check if locale is specified in cookie
  const localeCookie = cookies.get("NEXT_LOCALE");

  if (localeCookie && supportedLocales.includes(localeCookie)) {
    newUrl.pathname = `/${localeCookie}${newUrl.pathname}`;
    return NextResponse.rewrite(newUrl);
  } else {
    // Check if locale is specified in header
    const acceptLanguageHeader = headers.get("accept-language");

    if (acceptLanguageHeader) {
      const locale = languageParser.pick(
        supportedLocales,
        acceptLanguageHeader,
      );

      if (locale) {
        newUrl.pathname = `/${locale}${newUrl.pathname}`;
        return NextResponse.rewrite(newUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:id", "/demo", "/p/:id", "/profile", "/new", "/login"],
};
