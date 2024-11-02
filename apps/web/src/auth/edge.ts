import type { NextRequest, NextResponse } from "next/server";

import {
  getLocaleFromHeader,
  migrateGuestFromNextAuthCookie,
} from "@/app/guest";

import { GUEST_USER_COOKIE } from "./constants";
import { createGuestUser } from "./lib/create-guest-user";
import { safeParseGuestUser } from "./lib/parse-guest";
import { type User } from "./schema";

export async function initGuestUser(
  req: NextRequest,
  res: NextResponse,
): Promise<User> {
  await migrateGuestFromNextAuthCookie(req, res);
  const cookie = req.cookies.get(GUEST_USER_COOKIE);

  if (cookie) {
    const user = safeParseGuestUser(cookie.value);
    if (user) {
      return user;
    }
  }

  const user = await createGuestUser({
    locale: await getLocaleFromHeader(req),
  });

  res.cookies.set(GUEST_USER_COOKIE, JSON.stringify(user), {
    httpOnly: false,
  });

  return user;
}
