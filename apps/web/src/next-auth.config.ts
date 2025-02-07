import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

import { env } from "@/env";
import { isQuickCreateEnabled } from "@/features/quick-create/constants";

const publicRoutes = ["/login", "/register", "/invite/", "/poll/", "/auth"];

if (isQuickCreateEnabled) {
  publicRoutes.push("/quick-create", "/new");
}

/**
 * We split the next-auth config so that we can create an edge compatible instance that is
 * used in middleware.
 */
export const nextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  secret: env.SECRET_PASSWORD,
  providers: [],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.email = token.email as string;
      session.user.locale = token.locale;
      session.user.timeFormat = token.timeFormat;
      session.user.timeZone = token.timeZone;
      session.user.weekStart = token.weekStart;
      return session;
    },
    async authorized({ request, auth }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user?.email;
      const isPublicRoute = publicRoutes.some((route) =>
        nextUrl.pathname.startsWith(route),
      );
      if (isLoggedIn || isPublicRoute) {
        return true;
      }
      const redirectUrl = new URL("/login", request.url);
      if (nextUrl.pathname !== "/") {
        const redirectPath = nextUrl.pathname + nextUrl.search;
        redirectUrl.searchParams.set("redirectTo", redirectPath);
      }
      return NextResponse.redirect(redirectUrl);
    },
  },
} satisfies NextAuthConfig;
