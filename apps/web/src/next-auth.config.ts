import type { TimeFormat } from "@rallly/database";
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
      session.user.locale = token.locale as string;
      session.user.timeFormat = token.timeFormat as TimeFormat;
      session.user.timeZone = token.timeZone as string;
      session.user.weekStart = token.weekStart as number;
      return session;
    },
  },
} satisfies NextAuthConfig;
