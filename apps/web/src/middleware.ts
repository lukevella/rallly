import languages from "@rallly/languages";
import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

import { getLocaleFromHeader, initGuest } from "@/app/guest";
import { isSelfHosted } from "@/utils/constants";

const supportedLocales = Object.keys(languages);

export const middleware = withAuth(
  async function middleware(req) {
    const { nextUrl } = req;
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
    let locale = req.nextauth.token?.locale;
    if (locale && supportedLocales.includes(locale)) {
      newUrl.pathname = `/${locale}${newUrl.pathname}`;
    } else {
      // Check if locale is specified in header
      locale = await getLocaleFromHeader(req);

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
        const isGuest = !token?.email;
        if (
          isSelfHosted &&
          isGuest &&
          !(
            nextUrl.pathname.startsWith("/invite") ||
            nextUrl.pathname.startsWith("/login") ||
            nextUrl.pathname.startsWith("/register") ||
            nextUrl.pathname.startsWith("/auth") ||
            nextUrl.pathname.startsWith("/p/")
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
