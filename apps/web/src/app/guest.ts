import languages from "@rallly/languages";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { randomid } from "@rallly/utils/nanoid";
import languageParser from "accept-language-parser";
import type { NextRequest, NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import { decode, encode } from "next-auth/jwt";

const supportedLocales = Object.keys(languages);

function getCookieSettings() {
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
  const { name, secure } = getCookieSettings();

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
  const { name } = getCookieSettings();
  const token = req.cookies.get(name)?.value;
  if (token) {
    try {
      const jwt = await decode({
        token,
        secret: process.env.SECRET_PASSWORD,
      });
      if (jwt) {
        return jwt;
      }
    } catch (error) {
      // invalid token
      console.error(error);
    }
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
