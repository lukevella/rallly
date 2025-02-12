import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

import { decodeLegacyJWT } from "./helpers/jwt";

const isSecureCookie =
  process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false;

const prefix = isSecureCookie ? "__Secure-" : "";

const oldCookieName = prefix + "next-auth.session-token";
const newCookieName = prefix + "authjs.session-token";

/**
 * Migrates the next-auth cookies to the new authjs cookie names
 * This is needed for next-auth v5 which renamed the cookie prefix from 'next-auth' to 'authjs'
 */
export function withAuthMigration(
  middleware: (req: NextRequest) => void | Response | Promise<void | Response>,
) {
  return async (req: NextRequest) => {
    const oldCookie = req.cookies.get(oldCookieName);
    const newCookie = req.cookies.get(newCookieName);

    if (!oldCookie || newCookie) return middleware(req);

    const decodedCookie = await decodeLegacyJWT(oldCookie.value);

    const encodedCookie = await encode({
      token: decodedCookie,
      secret: process.env.SECRET_PASSWORD,
      salt: newCookieName,
    });

    const response = NextResponse.redirect(req.url);
    // Set the new cookie with the same value and attributes
    response.cookies.set(newCookieName, encodedCookie, {
      path: "/",
      secure: isSecureCookie,
      sameSite: "lax",
      httpOnly: true,
    });

    // Delete the old cookie
    response.cookies.delete(oldCookieName);

    return response;
  };
}
