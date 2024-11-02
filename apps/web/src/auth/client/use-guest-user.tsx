import Cookies from "js-cookie";

import { GUEST_USER_COOKIE } from "../constants";
import { safeParseGuestUser } from "../lib/parse-guest";

export function useGuestUser() {
  const cookie = Cookies.get(GUEST_USER_COOKIE);
  if (cookie) {
    return safeParseGuestUser(cookie);
  }

  return null;
}
