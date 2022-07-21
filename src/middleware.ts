import { NextRequest, NextResponse } from "next/server";

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
  newUrl.pathname = `/${locale}${newUrl.pathname}`;

  return NextResponse.rewrite(newUrl);
}

export const config = {
  // these are paths we should rewrite to prev
  matcher: ["/admin/:id", "/demo", "/p/:id", "/profile", "/new"],
};
