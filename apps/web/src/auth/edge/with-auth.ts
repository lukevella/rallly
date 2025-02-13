import type { NextResponse } from "next/server";
import type { NextAuthRequest, Session } from "next-auth";
import NextAuth from "next-auth";

import { nextAuthConfig } from "@/next-auth.config";

import {
  getLegacySession,
  migrateLegacyJWT,
} from "../legacy/next-auth-cookie-migration";

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

    let isLegacySession = false;

    if (!session) {
      try {
        session = await getLegacySession();
        if (session) {
          isLegacySession = true;
        }
      } catch (e) {
        console.error(e);
      }
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

    if (isLegacySession) {
      try {
        await migrateLegacyJWT(middlewareRes);
      } catch (e) {
        console.error(e);
      }
    }

    return middlewareRes;
  };
};
