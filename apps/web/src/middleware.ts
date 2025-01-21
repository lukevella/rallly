import languages from "@rallly/languages";
import { withPostHog } from "@rallly/posthog/next/middleware";
import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

import { getLocaleFromHeader, initGuest } from "@/app/guest";
import { isSelfHosted } from "@/utils/constants";

const supportedLocales = Object.keys(languages);

const publicRoutes = [
  "/login",
  "/register",
  "/invite/",
  "/new",
  "/poll/",
  "/quick-create",
  "/auth/login",
];

export const middleware = withAuth(
  async function middleware(req) {
    const { nextUrl } = req;
    const newUrl = nextUrl.clone();

    const isLoggedIn = req.nextauth.token?.email;
    // set x-pathname header to the pathname

    // if the user is already logged in, don't let them access the login page
    if (/^\/(login)/.test(newUrl.pathname) && isLoggedIn) {
      newUrl.pathname = "/";
      return NextResponse.redirect(newUrl);
    }

    // if the user is not logged in and the page is not public, redirect to login
    if (
      !isLoggedIn &&
      !publicRoutes.some((route) => newUrl.pathname.startsWith(route))
    ) {
      newUrl.searchParams.set("callbackUrl", newUrl.pathname);
      newUrl.pathname = "/login";
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
    res.headers.set("x-pathname", newUrl.pathname);
    const jwt = await initGuest(req, res);

    if (jwt?.sub) {
      await withPostHog(res, { distinctID: jwt.sub });
    }

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
