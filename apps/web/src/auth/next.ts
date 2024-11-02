import type { NextApiRequest } from "next";
import { cookies } from "next/headers";

import { GUEST_USER_COOKIE } from "./constants";
import { safeParseGuestUser } from "./lib/parse-guest";
import { userSchema } from "./schema";

export async function getGuestUserFromApiRequest(req: NextApiRequest) {
  const cookie = req.cookies[GUEST_USER_COOKIE];

  if (cookie) {
    try {
      const res = userSchema.safeParse(JSON.parse(cookie));
      if (res.success) {
        return res.data;
      }
    } catch (error) {
      console.error("Error parsing guest user cookie", error);
    }
  }

  return null;
}

export async function getGuestUser() {
  const cookie = cookies().get(GUEST_USER_COOKIE)?.value;
  if (cookie) {
    return safeParseGuestUser(cookie);
  }
  return null;
}
