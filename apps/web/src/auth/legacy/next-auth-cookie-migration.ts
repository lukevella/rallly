import { absoluteUrl } from "@rallly/utils/absolute-url";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { encode } from "next-auth/jwt";

import { decodeLegacyJWT } from "./helpers/jwt";

const isSecureCookie = absoluteUrl().startsWith("https://");

const prefix = isSecureCookie ? "__Secure-" : "";

const oldCookieName = prefix + "next-auth.session-token";
const newCookieName = prefix + "authjs.session-token";

export async function getLegacySession(): Promise<Session | null> {
  const cookieStore = cookies();
  const legacySessionCookie = cookieStore.get(oldCookieName);
  if (legacySessionCookie && legacySessionCookie.value) {
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

function deleteLegacyCookie(res: NextResponse) {
  const cookieStore = cookies();
  const oldCookie = cookieStore.get(oldCookieName);
  if (oldCookie) {
    // Delete the old cookie
    res.cookies.set(oldCookieName, oldCookie.value, {
      httpOnly: true,
      secure: isSecureCookie,
      expires: new Date(0),
      sameSite: "lax",
      path: "/",
    });
  }
}

async function setNewSessionCookie(res: NextResponse, jwt: JWT) {
  const newJWT = await encode({
    token: jwt,
    secret: process.env.SECRET_PASSWORD,
    salt: newCookieName,
  });

  // Set new session cookie
  res.cookies.set(newCookieName, newJWT, {
    httpOnly: true,
    secure: isSecureCookie,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Replace the old legacy cookie with the new one
 */
export async function migrateLegacyJWT(res: NextResponse) {
  const legacyJWT = await getLegacyJWT();

  if (legacyJWT) {
    await setNewSessionCookie(res, legacyJWT);
    deleteLegacyCookie(res);
  }
}
