import { randomid } from "@rallly/backend/utils/nanoid";
import type { TimeFormat } from "@rallly/database";
import { unsealData } from "iron-session/edge";
import { NextRequest, NextResponse } from "next/server";
import { encode, JWT } from "next-auth/jwt";

import { absoluteUrl } from "@/utils/absolute-url";

function getCookieSettings() {
  const secure = absoluteUrl().startsWith("https://");
  const prefix = secure ? "__Secure-" : "";
  const name = `${prefix}next-auth.session-token`;
  return {
    secure,
    name,
  };
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

export async function resetUser(res: NextResponse) {
  // resets to a new guest user
  const jwt: JWT = {
    sub: `user-${randomid()}`,
    email: null,
  };

  await setCookie(res, jwt);
}

export async function initGuest(req: NextRequest, res: NextResponse) {
  const { name } = getCookieSettings();

  if (req.cookies.has(name)) {
    // already has a session token
    return;
  }

  // TODO (Luke Vella) [2023-11-07]: Remove this after 30 days (Date: 2023-12-07)
  const legacyJwt = await getLegacyToken(req, res);

  const jwt: JWT = legacyJwt || {
    sub: `user-${randomid()}`,
    email: null,
  };

  await setCookie(res, jwt);

  return jwt;
}

async function getLegacyToken(req: NextRequest, res: NextResponse) {
  /**
   * We moved from a bespoke session implementation to next-auth.
   * This middleware looks for the old session cookie and moves it to
   * a temporary cookie accessible to the client which will exchange it
   * for a new session token with the legacy-token provider.
   */
  const legacyToken = req.cookies.get("rallly-session");
  if (legacyToken) {
    // delete old cookie
    res.cookies.delete("rallly-session");

    // make sure old cookie isn't expired
    const payload = await unsealData<{
      user: {
        id: string;
        isGuest: boolean;
        preferences?: {
          weekStart?: number;
          timeZone?: string;
          timeFormat?: TimeFormat;
        };
      };
    }>(legacyToken.value, {
      password: process.env.SECRET_PASSWORD,
    });
    // if it's not expired, write it to a new cookie that we
    // can read from the client
    if (Object.keys(payload).length > 0 && payload?.user?.isGuest) {
      const jwt: JWT = {
        sub: payload.user.id,
        email: null,
        ...payload.user.preferences,
      };

      return jwt;
    }
  }
  return null;
}
