import "server-only";
import { supportedLngs } from "@rallly/languages";
import { cookies } from "next/headers";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_OPTIONS,
} from "@/lib/locale/constants";

export async function getLocaleCookie() {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return locale && supportedLngs.includes(locale) ? locale : undefined;
}

// Server-action/RSC contexts only. Never call from better-auth hooks:
// mutating Next's cookie store during a route-handler request makes Next
// rebuild the handler's Set-Cookie headers through a name-keyed map,
// dropping duplicate-name cookies (see the locale writes in lib/auth.ts).
export async function setLocaleCookie(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_OPTIONS);
}
