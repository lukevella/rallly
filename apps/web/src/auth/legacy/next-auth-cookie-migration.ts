import { absoluteUrl } from "@rallly/utils/absolute-url";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
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
        expires: decodedCookie.exp
          ? new Date(decodedCookie.exp * 1000).toISOString()
          : new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString(),
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
