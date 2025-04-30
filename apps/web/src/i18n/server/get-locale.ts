import { defaultLocale } from "@rallly/languages";
import { headers } from "next/headers";

export async function getLocale() {
  const headersList = await headers();
  const localeFromHeader = headersList.get("x-locale");

  if (!localeFromHeader) {
    return defaultLocale;
  }
  return localeFromHeader;
}
