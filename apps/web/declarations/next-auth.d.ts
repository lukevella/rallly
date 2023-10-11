/* eslint-disable @typescript-eslint/no-unused-vars */
import { extend } from "lodash";
import NextAuth, { DefaultSession } from "next-auth";
import { DefaultJWT, JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    version: number;
    user: {
      isGuest: boolean;
      id: string;
      name?: string;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    userId?: string;
    plan?: "guest" | "user" | "pro";
  }
}
