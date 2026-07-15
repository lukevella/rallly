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

export async function setLocaleCookie(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_OPTIONS);
}

export async function deleteLocaleCookie() {
  const cookieStore = await cookies();
  // Expire via set() with the same attributes — a deletion only takes
  // effect when path and domain match the original cookie.
  cookieStore.set(LOCALE_COOKIE_NAME, "", {
    ...LOCALE_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
