import languages from "@rallly/languages";
import { withPostHog } from "@rallly/posthog/next/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { getLocaleFromHeader } from "@/app/guest";
import { withAuthMigration } from "@/auth/legacy/next-auth-cookie-migration";
import { nextAuthConfig } from "@/next-auth.config";

const { auth } = NextAuth(nextAuthConfig);

const supportedLocales = Object.keys(languages);

// Middleware for handling authentication and routing
const withAuth = auth(async (req) => {
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

// Compose middlewares
export default async function middleware(request: NextRequest) {
  // First run the migration middleware
  const migrationResponse = await withAuthMigration(request);
  if (migrationResponse) {
    return migrationResponse;
  }

  // Otherwise, continue with auth middleware
  return withAuth(request, undefined as never);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\.).*)"],
};
