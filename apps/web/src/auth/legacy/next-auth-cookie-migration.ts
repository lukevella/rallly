import { absoluteUrl } from "@rallly/utils/absolute-url";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { encode } from "next-auth/jwt";

import { decodeLegacyJWT } from "./helpers/jwt";

const isSecureCookie = absoluteUrl().startsWith("https://");

const prefix = isSecureCookie ? "__Secure-" : "";

const oldCookieName = prefix + "next-auth.session-token";
const newCookieName = prefix + "authjs.session-token";

export async function getLegacySession(): Promise<Session | null> {
  const cookieStore = cookies();
  const legacySessionCookie = cookieStore.get(oldCookieName);
  if (legacySessionCookie) {
    const decodedCookie = await decodeLegacyJWT(legacySessionCookie.value);

    if (decodedCookie?.sub) {
      const { sub: id, ...rest } = decodedCookie;
      return {
        user: { id, ...rest },
        expires: new Date(decodedCookie.exp ?? 0).toISOString(),
      };
    }
  }

  return null;
}

async function getLegacyJWT() {
  const cookieStore = cookies();
  const legacySessionCookie = cookieStore.get(oldCookieName);
  if (legacySessionCookie) {
    const decodedCookie = await decodeLegacyJWT(legacySessionCookie.value);
    if (decodedCookie) {
      return decodedCookie;
    }
  }
  return null;
}

/**
 * Replace the old legacy cookie with the new one
 */
export async function migrateLegacyJWT(res: NextResponse) {
  const legacyJWT = await getLegacyJWT();

  if (legacyJWT) {
    const newJWT = await encode({
      token: legacyJWT,
      secret: process.env.SECRET_PASSWORD,
      salt: newCookieName,
    });

    res.cookies.set(newCookieName, newJWT, {
      httpOnly: true,
      secure: isSecureCookie,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      sameSite: "lax",
      path: "/",
    });
    res.cookies.delete(oldCookieName);
  }
}

/**
 * Migrates the next-auth cookies to the new authjs cookie names
 * This is needed for next-auth v5 which renamed the cookie prefix from 'next-auth' to 'authjs'
 */
export function withAuthMigration(
  middleware: (req: NextRequest) => Promise<NextResponse>,
) {
  async function runMiddlewareAndDeleteOldCookie(req: NextRequest) {
    const res = await middleware(req);
    res.cookies.set(oldCookieName, "", {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }
  return async (req: NextRequest) => {
    const oldCookie = req.cookies.get(oldCookieName);

    if (req.cookies.get(newCookieName) || !oldCookie || !oldCookie.value) {
      // exit early if the new cookie exists or the old cookie doesn't exist or is invalid
      return middleware(req);
    }

    try {
      const decodedCookie = await decodeLegacyJWT(oldCookie.value);

      // If old cookie is invalid, delete the old cookie
      if (decodedCookie) {
        // Set the new cookie
        const encodedCookie = await encode({
          token: decodedCookie,
          secret: process.env.SECRET_PASSWORD,
          salt: newCookieName,
        });

        // Run the middleware with the new cookie set
        req.cookies.set({
          name: newCookieName,
          value: encodedCookie,
        });

        const res = await runMiddlewareAndDeleteOldCookie(req);

        // Set the new cookie in the response
        res.cookies.set(newCookieName, encodedCookie, {
          httpOnly: true,
          secure: isSecureCookie,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          sameSite: "lax",
          path: "/",
        });

        return res;
      }
    } catch (e) {
      console.error(e);
    }

    return runMiddlewareAndDeleteOldCookie(req);
  };
}
