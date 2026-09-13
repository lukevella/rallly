import { defaultLocale, supportedLngs } from "@rallly/languages";
import { getPreferredLocaleFromHeaders } from "@rallly/languages/get-preferred-locale";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";

export async function getLocale() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && supportedLngs.includes(cookieLocale)) {
    return cookieLocale;
  }

  const headersList = await headers();
  const acceptLanguageHeader = headersList.get("accept-language");
  if (acceptLanguageHeader) {
    return getPreferredLocaleFromHeaders({ acceptLanguageHeader });
  }

  return defaultLocale;
}
