import type { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
import NextAuth from "next-auth";

import { nextAuthConfig } from "@/next-auth.config";

import {
  getLegacySession,
  migrateLegacyJWT,
} from "./legacy/next-auth-cookie-migration";

const { auth } = NextAuth(nextAuthConfig);

export const withAuth = (
  middleware: (request: NextAuthRequest) => Promise<NextResponse>,
) => {
  return async (request: NextAuthRequest) => {
    const legacySession = await getLegacySession();

    const session = legacySession || (await auth());

    const res = await nextAuthConfig.callbacks.authorized({
      request,
      auth: session,
    });

    request.auth = session;

    if (res !== true) {
      return res;
    }

    const middlewareRes = await middleware(request);

    if (legacySession) {
      try {
        await migrateLegacyJWT(middlewareRes);
      } catch (e) {
        console.error(e);
      }
    }

    return middlewareRes;
  };
};
