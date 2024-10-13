import type { TimeFormat } from "@rallly/database";
import { extend } from "lodash";
import NextAuth, { type DefaultSession, type DefaultUser } from "next-auth";
import { type DefaultJWT, JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      timeZone?: string | null;
      timeFormat?: TimeFormat | null;
      locale?: string | null;
      weekStart?: number | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    locale?: string | null;
    timeZone?: string | null;
    timeFormat?: TimeFormat | null;
    weekStart?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    locale?: string | null;
    timeZone?: string | null;
    timeFormat?: TimeFormat | null;
    weekStart?: number | null;
  }
}
