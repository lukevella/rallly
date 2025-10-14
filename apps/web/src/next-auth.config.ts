import type { NextAuthConfig } from "next-auth";

import { env } from "@/env";

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
      session.user.timeFormat = token.timeFormat;
      session.user.timeZone = token.timeZone;
      session.user.weekStart = token.weekStart;
      return session;
    },
  },
} satisfies NextAuthConfig;
