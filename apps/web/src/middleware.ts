import languages from "@rallly/languages";
import { withPostHog } from "@rallly/posthog/next/middleware";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { getLocaleFromHeader } from "@/app/guest";
import { nextAuthConfig } from "@/next-auth.config";

const { auth } = NextAuth(nextAuthConfig);

const supportedLocales = Object.keys(languages);

const publicRoutes = [
  "/login",
  "/register",
  "/invite/",
  "/poll/",
  "/auth/login",
];

if (process.env.QUICK_CREATE_ENABLED === "true") {
  publicRoutes.push("/quick-create", "/new");
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();

  const isLoggedIn = req.auth?.user?.email;

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
    if (newUrl.pathname !== "/") {
      newUrl.searchParams.set("redirectTo", newUrl.pathname);
    }
    newUrl.pathname = "/login";
    return NextResponse.redirect(newUrl);
  }

  // Check if locale is specified in cookie
  let locale = req.auth?.user?.locale;
  if (locale && supportedLocales.includes(locale)) {
    newUrl.pathname = `/${locale}${newUrl.pathname}`;
  } else {
    // Check if locale is specified in header
    locale = await getLocaleFromHeader(req);

    newUrl.pathname = `/${locale}${newUrl.pathname}`;
  }

  const res = NextResponse.rewrite(newUrl);
  res.headers.set("x-pathname", newUrl.pathname);

  if (req.auth?.user?.id) {
    await withPostHog(res, { distinctID: req.auth.user.id });
  }

  return res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
