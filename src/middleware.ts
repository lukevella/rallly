import { NextRequest, NextResponse } from "next/server";

const supportedLocales = ["en", "es", "de", "fr", "pt-BR", "sv"];

export function middleware({ headers, cookies, nextUrl }: NextRequest) {
  const language =
    cookies.get("NEXT_LOCALE") ??
    (headers
      .get("accept-language")
      ?.split(",")?.[0]
      .split("-")?.[0]
      .toLowerCase() ||
      "en");

  const newUrl = nextUrl.clone();

  if (supportedLocales.includes(language)) {
    newUrl.pathname = `/${language}${newUrl.pathname}`;
  } else if (language === "pt") {
    // For now we send all portuguese language requests to pt-BR
    newUrl.pathname = `/pt-BR${newUrl.pathname}`;
  }

  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: ["/admin/:id", "/demo", "/p/:id", "/profile", "/new", "/login"],
};
