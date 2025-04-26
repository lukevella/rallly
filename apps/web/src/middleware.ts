import languages from "@rallly/languages";
import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import { withPostHog } from "@rallly/posthog/next/middleware";
import { NextResponse } from "next/server";

import { withAuth } from "@/auth/edge";

const supportedLocales = Object.keys(languages);

export const middleware = withAuth(async (req) => {
  const { nextUrl } = req;
  const newUrl = nextUrl.clone();
  const pathname = newUrl.pathname;

  const isLoggedIn = req.auth?.user?.email;
  // if the user is already logged in, don't let them access the login page
  if (/^\/(login)/.test(pathname) && isLoggedIn) {
    newUrl.pathname = "/";
    return NextResponse.redirect(newUrl);
  }

  const locale =
    req.auth?.user?.locale ||
    getPreferredLocale({
      acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
    });

  if (supportedLocales.includes(locale)) {
    newUrl.pathname = `/${locale}${pathname}`;
  }

  const res = NextResponse.rewrite(newUrl);
  res.headers.set("x-locale", locale);
  res.headers.set("x-pathname", pathname);

  if (req.auth?.user?.id) {
    await withPostHog(res, { distinctID: req.auth.user.id });
  }

  return res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
