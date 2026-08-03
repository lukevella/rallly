import { cache } from "react";
import { defaultNS } from "@/i18n/settings";

import { initI18next } from "./i18n";
import { getLocale } from "./server/get-locale";

export const getTranslation = cache(async (localeOverride?: string) => {
  let locale = localeOverride;

  if (!locale) {
    locale = await getLocale();
  }

  const { i18n } = await initI18next({
    lng: locale,
  });
  return {
    t: i18n.getFixedT(locale, defaultNS),
    i18n,
  };
});
