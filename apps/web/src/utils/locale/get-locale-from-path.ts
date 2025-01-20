import { defaultLocale } from "@rallly/languages";
import { headers } from "next/headers";

export function getLocaleFromPath() {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || defaultLocale;
  return pathname.split("/")[1];
}
