import { defaultNS } from "@/i18n/settings";
import { getLocaleFromPath } from "@/utils/locale/get-locale-from-path";

import { initI18next } from "./i18n";

export async function getTranslation(localeOverride?: string) {
  const localeFromPath = getLocaleFromPath();
  const locale = localeOverride || localeFromPath;
  const i18nextInstance = await initI18next(locale, defaultNS);
  return {
    t: i18nextInstance.getFixedT(locale, defaultNS),
    i18n: i18nextInstance,
  };
}
