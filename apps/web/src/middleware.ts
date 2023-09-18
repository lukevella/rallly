import { getSession } from "@rallly/backend/next/edge";
import languages from "@rallly/languages";
import languageParser from "accept-language-parser";
import { NextRequest, NextResponse } from "next/server";

const supportedLocales = Object.keys(languages);

// these paths are always public
const publicPaths = ["/login", "/register", "/invite", "/auth"];
// these paths always require authentication
const protectedPaths = ["/settings/profile"];

const checkLoginRequirements = async (req: NextRequest, res: NextResponse) => {
  const session = await getSession(req, res);
  const isGuest = session.user?.isGuest !== false;

  if (!isGuest) {
    // already logged in
    return false;
  }

  // TODO (Luke Vella) [2023-09-11]: We should handle this on the client-side
  if (process.env.NEXT_PUBLIC_SELF_HOSTED === "true") {
    // when self-hosting, only public paths don't require login
    return !publicPaths.some((publicPath) =>
      req.nextUrl.pathname.startsWith(publicPath),
    );
  } else {
    // when using the hosted version, only protected paths require login
    return protectedPaths.some((protectedPath) =>
      req.nextUrl.pathname.includes(protectedPath),
    );
  }
};

export async function middleware(req: NextRequest) {
  const { headers, cookies, nextUrl } = req;
  const newUrl = nextUrl.clone();
  const res = NextResponse.next();

  const isLoginRequired = await checkLoginRequirements(req, res);

  if (isLoginRequired) {
    newUrl.pathname = "/login";
    newUrl.searchParams.set("redirect", req.nextUrl.pathname);
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
