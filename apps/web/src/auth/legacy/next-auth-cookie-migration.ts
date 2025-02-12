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

    // If the old cookie doesn't exist, return the middleware
    if (!oldCookie) {
      return middleware(req);
    }

    const response = NextResponse.redirect(req.url);
    response.cookies.delete(oldCookieName);

    // If the new cookie exists, delete the old cookie first and rerun middleware
    if (req.cookies.get(newCookieName)) {
      return response;
    }

    const decodedCookie = await decodeLegacyJWT(oldCookie.value);

    // If old cookie is invalid, delete the old cookie first and rerun middleware
    if (!decodedCookie) {
      return response;
    }

    // Set the new cookie
    const encodedCookie = await encode({
      token: decodedCookie,
      secret: process.env.SECRET_PASSWORD,
      salt: newCookieName,
    });

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
