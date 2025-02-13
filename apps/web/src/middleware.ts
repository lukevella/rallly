import languages from "@rallly/languages";
import { withPostHog } from "@rallly/posthog/next/middleware";
import { NextResponse } from "next/server";

import { getLocaleFromHeader } from "@/app/guest";
import { withAuth } from "@/auth/edge";

const supportedLocales = Object.keys(languages);

export const middleware = withAuth(async (req) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();

  const isLoggedIn = req.auth?.user?.email;

  // if the user is already logged in, don't let them access the login page
  if (/^\/(login)/.test(newUrl.pathname) && isLoggedIn) {
    newUrl.pathname = "/";
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
