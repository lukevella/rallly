import { defaultLocale } from "@rallly/languages";
import { headers } from "next/headers";

export async function getLocaleFromPath() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || defaultLocale;
  return pathname.split("/")[1];
}
