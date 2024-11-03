import Cookies from "js-cookie";

import { GUEST_USER_COOKIE } from "../constants";

export function deleteGuestUser() {
  Cookies.remove(GUEST_USER_COOKIE);
}
