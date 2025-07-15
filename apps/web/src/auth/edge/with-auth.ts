import type { NextResponse } from "next/server";
import type { NextAuthRequest, Session } from "next-auth";
import NextAuth from "next-auth";

import { nextAuthConfig } from "@/next-auth.config";

const { auth } = NextAuth(nextAuthConfig);

export const withAuth = (
  middleware: (request: NextAuthRequest) => Promise<NextResponse>,
) => {
  return async (request: NextAuthRequest) => {
    let session: Session | null = null;

    try {
      session = await auth();
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await nextAuthConfig.callbacks.authorized({
        request,
        auth: session,
      });

      if (res !== true) {
        return res;
      }
    } catch (e) {
      console.error(e);
    }

    request.auth = session;

    const middlewareRes = await middleware(request);

    return middlewareRes;
  };
};
