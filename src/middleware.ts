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

  // TODO (Luke Vella) [2022-08-18]: There seems to be a bug on vercel that
  // results in the component being remounted when doing NextResponse.next() rather
  // than loading the correct component.
  // return NextResponse.next();
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: ["/admin/:id", "/demo", "/p/:id", "/profile", "/new", "/login"],
};
