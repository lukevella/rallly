import { defaultLocale, supportedLngs } from "@rallly/languages";
import { headers } from "next/headers";

export function getLocaleFromPath() {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || defaultLocale;
  const localeFromPath = pathname.split("/")[1];
  return supportedLngs.includes(localeFromPath)
    ? localeFromPath
    : defaultLocale;
}
