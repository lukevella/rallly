import type { NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import NextAuth from "next-auth";

import { nextAuthConfig } from "@/next-auth.config";

const { auth } = NextAuth(nextAuthConfig);

export function withAuth(
  middleware: (
    req: NextAuthRequest,
  ) => void | Response | Promise<void | Response>,
): (req: NextRequest) => void | Response | Promise<void | Response> {
  return (req: NextRequest) => auth(middleware)(req, undefined as never);
}
