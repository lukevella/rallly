import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";
import { resolveLocale } from "@/lib/locale/server";

export async function getLocale() {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguageHeader: headersList.get("accept-language"),
  });
}
