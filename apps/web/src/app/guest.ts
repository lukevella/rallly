import { NextRequest, NextResponse } from "next/server";
import { encode, JWT } from "next-auth/jwt";

import { absoluteUrl } from "@/utils/absolute-url";
import { randomid } from "@/utils/nanoid";

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

  const jwt: JWT = {
    sub: `user-${randomid()}`,
    email: null,
  };

  await setCookie(res, jwt);

  return jwt;
}
