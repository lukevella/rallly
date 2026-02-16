import { defaultNS } from "@/i18n/settings";

import { initI18next } from "./i18n";

export async function getTranslation(locale: string) {
  const { i18n } = await initI18next({
    lng: locale,
  });

  return {
    t: i18n.getFixedT(locale, defaultNS),
    i18n,
  };
}
