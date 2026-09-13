import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";
import { resolveLocale } from "@/lib/locale/server";

export async function getLocale() {
  const headersList = await headers();
  const localeFromHeader = headersList.get("x-locale");

  if (localeFromHeader) {
    return localeFromHeader;
  }

  // The proxy that sets x-locale skips /api, so route handlers (better-auth
  // email callbacks included) resolve the locale the same way it would have.
  const cookieStore = await cookies();
  return resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguageHeader: headersList.get("accept-language"),
  });
}
