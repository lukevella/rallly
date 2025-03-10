import type { NextResponse } from "next/server";
import type { NextAuthRequest, Session } from "next-auth";
import NextAuth from "next-auth";

import { nextAuthConfig } from "@/next-auth.config";

import {
  deleteLegacyCookie,
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
    let isExpiredLegacySession = false;

    if (!session) {
      try {
        session = await getLegacySession();
        if (session) {
          isLegacySession = true;
        }
      } catch (e) {
        isExpiredLegacySession = true;
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
      console.warn("Found legacy session, migrating…");
      try {
        await migrateLegacyJWT(middlewareRes);
      } catch (e) {
        console.error(e);
      }
    }

    if (isExpiredLegacySession) {
      console.warn("Found expired legacy session, deleting…");
      deleteLegacyCookie(middlewareRes);
    }

    return middlewareRes;
  };
};
