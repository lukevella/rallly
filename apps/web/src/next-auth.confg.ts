import type { NextAuthConfig } from "next-auth";

export const nextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.SECRET_PASSWORD,
  providers: [],
} satisfies NextAuthConfig;
