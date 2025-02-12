import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

import { decode } from "./next-auth-v4/jwt";

/**
 * Migrates the next-auth cookies to the new authjs cookie names
 * This is needed for next-auth v5 which renamed the cookie prefix from 'next-auth' to 'authjs'
 */
export async function withAuthMigration(request: NextRequest) {
  const isSecureCookie =
    process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false;

  const prefix = isSecureCookie ? "__Secure-" : "";

  const oldCookieName = prefix + "next-auth.session-token";
  const newCookieName = prefix + "authjs.session-token";

  const oldCookie = request.cookies.get(oldCookieName);

  const newCookie = request.cookies.get(newCookieName);

  if (!oldCookie || newCookie) return;

  const decodedCookie = await decode({
    token: oldCookie.value,
    secret: process.env.SECRET_PASSWORD,
  });

  const encodedCookie = await encode({
    token: decodedCookie,
    secret: process.env.SECRET_PASSWORD,
    salt: newCookieName,
  });

  const response = NextResponse.redirect(request.url);
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
}
