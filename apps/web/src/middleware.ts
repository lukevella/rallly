import { NextResponse } from "next/server";
import { withAuth } from "@/auth/edge";
import { getLocaleFromRequest } from "@/lib/locale/server";

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

  const locale = getLocaleFromRequest(req);

  newUrl.pathname = `/${locale}${pathname}`;

  const res = NextResponse.rewrite(newUrl);
  res.headers.set("x-locale", locale);
  res.headers.set("x-pathname", pathname);

  return res;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
