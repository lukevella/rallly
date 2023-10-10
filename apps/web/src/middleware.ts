import languages from "@rallly/languages";
import languageParser from "accept-language-parser";
import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

const supportedLocales = Object.keys(languages);

export default withAuth(
  function middleware(req) {
    const { headers, cookies, nextUrl } = req;
    const newUrl = nextUrl.clone();
    const res = NextResponse.next();

    // if the user is already logged in, don't let them access the login page
    if (
      /^\/(login|register)/.test(newUrl.pathname) &&
      req.nextauth.token?.email
    ) {
      newUrl.pathname = "/";
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
  },
  {
    secret: process.env.SECRET_PASSWORD,
    callbacks: {
      authorized: () => true, // needs to be true to allow access to all pages
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
