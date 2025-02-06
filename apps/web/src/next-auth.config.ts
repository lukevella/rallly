import type { NextAuthConfig } from "next-auth";

import { env } from "@/env";

export const nextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  secret: env.SECRET_PASSWORD,
  providers: [],
} satisfies NextAuthConfig;
