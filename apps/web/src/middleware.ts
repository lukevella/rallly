import languages from "@rallly/languages";
import languageParser from "accept-language-parser";
import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

import { initGuest } from "@/app/guest";
import { isSelfHosted } from "@/utils/constants";

const supportedLocales = Object.keys(languages);

export const middleware = withAuth(
  async function middleware(req) {
    const { headers, nextUrl } = req;
    const newUrl = nextUrl.clone();

    // if the user is already logged in, don't let them access the login page
    if (
      /^\/(login|register)/.test(newUrl.pathname) &&
      req.nextauth.token?.email
    ) {
      newUrl.pathname = "/";
      return NextResponse.redirect(newUrl);
    }

    // Check if locale is specified in cookie
    const preferredLocale = req.nextauth.token?.locale;
    if (preferredLocale && supportedLocales.includes(preferredLocale)) {
      newUrl.pathname = `/${preferredLocale}${newUrl.pathname}`;
    } else {
      // Check if locale is specified in header
      const acceptLanguageHeader = headers.get("accept-language");
      const localeFromHeader = acceptLanguageHeader
        ? languageParser.pick(supportedLocales, acceptLanguageHeader)
        : null;
      const locale = localeFromHeader ?? "en";

      newUrl.pathname = `/${locale}${newUrl.pathname}`;
    }

    const res = NextResponse.rewrite(newUrl);

    await initGuest(req, res);

    return res;
  },
  {
    secret: process.env.SECRET_PASSWORD,
    callbacks: {
      authorized: ({ token, req }) => {
        const nextUrl = req.nextUrl;

        if (
          isSelfHosted &&
          token?.email === null &&
          !(
            nextUrl.pathname.startsWith("/invite") ||
            nextUrl.pathname.startsWith("/login") ||
            nextUrl.pathname.startsWith("/register") ||
            nextUrl.pathname.startsWith("/auth") ||
            nextUrl.pathname.startsWith("/p")
          )
        ) {
          // limit which pages guests can access for self-hosted instances
          return false;
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
