import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import { getPosthogBootstrapCookie } from "@rallly/posthog/utils";
import { NextResponse } from "next/server";

import { withAuth } from "@/auth/edge";

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

  const locale = getPreferredLocale({
    userLocale: req.auth?.user?.locale ?? undefined,
    acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
  });

  newUrl.pathname = `/${locale}${pathname}`;

  const res = NextResponse.rewrite(newUrl);
  res.headers.set("x-locale", locale);
  res.headers.set("x-pathname", pathname);

  if (req.auth?.user?.id) {
    const bootstrapCookie = getPosthogBootstrapCookie({
      distinctID: req.auth.user.id,
    });
    if (bootstrapCookie) {
      res.cookies.set(bootstrapCookie);
    }
  }

  return res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
