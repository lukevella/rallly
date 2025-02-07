import type { NextAuthConfig } from "next-auth";

import { env } from "@/env";

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
  },
} satisfies NextAuthConfig;
