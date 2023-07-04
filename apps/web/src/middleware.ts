import { getSession } from "@rallly/backend/next/edge";
import languages from "@rallly/languages";
import languageParser from "accept-language-parser";
import { NextRequest, NextResponse } from "next/server";

const supportedLocales = Object.keys(languages);

// these paths are always public
const publicPaths = ["/login", "/register", "/invite", "/auth"];
// these paths always require authentication
const protectedPaths = ["/settings/billing", "/settings/profile"];

export async function middleware(req: NextRequest) {
  const { headers, cookies, nextUrl } = req;
  const newUrl = nextUrl.clone();
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (
    process.env.AUTH_REQUIRED &&
    session.user?.isGuest !== false &&
    !publicPaths.some((publicPath) =>
      req.nextUrl.pathname.startsWith(publicPath),
    )
  ) {
    newUrl.pathname = "/login";
    return NextResponse.redirect(newUrl);
  }

  if (
    session.user?.isGuest !== false &&
    protectedPaths.some((protectedPath) =>
      req.nextUrl.pathname.includes(protectedPath),
    )
  ) {
    newUrl.pathname = "/login";
    return NextResponse.redirect(newUrl);
  }

  // Check if locale is specified in cookie
  const localeCookie = cookies.get("NEXT_LOCALE");
  const preferredLocale = localeCookie && localeCookie.value;
  if (preferredLocale && supportedLocales.includes(preferredLocale)) {
    newUrl.pathname = `/${preferredLocale}${newUrl.pathname}`;
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

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
