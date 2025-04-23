import { defaultLocale } from "@rallly/languages";
import { headers } from "next/headers";

export function getLocale() {
  const headersList = headers();
  const localeFromHeader = headersList.get("x-locale");
  if (!localeFromHeader) {
    return defaultLocale;
  }
  return localeFromHeader;
}
