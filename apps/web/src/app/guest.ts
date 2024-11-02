import languages from "@rallly/languages";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { randomid } from "@rallly/utils/nanoid";
import languageParser from "accept-language-parser";
import type { NextRequest, NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import { decode, encode } from "next-auth/jwt";

import { GUEST_USER_COOKIE } from "@/auth/constants";
import { createGuestUser } from "@/auth/lib/create-guest-user";

const supportedLocales = Object.keys(languages);

function getNextAuthCookieSettings() {
  const secure = absoluteUrl().startsWith("https://");
  const prefix = secure ? "__Secure-" : "";
  const name = `${prefix}next-auth.session-token`;
  return {
    secure,
    name,
  };
}

export async function getLocaleFromHeader(req: NextRequest) {
  // Check if locale is specified in header
  const headers = req.headers;
  const acceptLanguageHeader = headers.get("accept-language");
  const localeFromHeader = acceptLanguageHeader
    ? languageParser.pick(supportedLocales, acceptLanguageHeader)
    : null;
  return localeFromHeader ?? "en";
}

async function setCookie(res: NextResponse, jwt: JWT) {
  const { name, secure } = getNextAuthCookieSettings();

  const token = await encode({
    token: jwt,
    secret: process.env.SECRET_PASSWORD,
  });

  res.cookies.set({
    name,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
}

export async function migrateGuestFromNextAuthCookie(
  req: NextRequest,
  res: NextResponse,
) {
  const { name } = getNextAuthCookieSettings();
  if (req.cookies.has(name)) {
    // get user session token
    const token = req.cookies.get(name)?.value;
    if (token) {
      const jwt = await decode({
        token,
        secret: process.env.SECRET_PASSWORD,
      });
      if (jwt?.sub && jwt?.locale) {
        const user = await createGuestUser({
          id: jwt.sub,
          locale: jwt.locale,
          timeZone: jwt.timeZone ?? undefined,
          weekStart: jwt.weekStart ?? undefined,
          timeFormat: jwt.timeFormat ?? undefined,
        });
        res.cookies.set(GUEST_USER_COOKIE, JSON.stringify(user));
      }
    }
  }
}

export async function resetUser(req: NextRequest, res: NextResponse) {
  // resets to a new guest user
  const locale = await getLocaleFromHeader(req);

  const jwt: JWT = {
    sub: `user-${randomid()}`,
    email: null,
    locale,
  };

  await setCookie(res, jwt);
}

export async function initGuest(req: NextRequest, res: NextResponse) {
  const { name } = getNextAuthCookieSettings();

  if (req.cookies.has(name)) {
    // already has a session token
    return;
  }

  const locale = await getLocaleFromHeader(req);

  const jwt: JWT = {
    sub: `user-${randomid()}`,
    email: null,
    locale,
  };

  await setCookie(res, jwt);

  return jwt;
}
