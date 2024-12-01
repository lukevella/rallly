import { defaultNS } from "@/i18n/settings";

import { initI18next } from "./i18n";

export async function getTranslation(locale: string) {
  const i18nextInstance = await initI18next(locale, defaultNS);
  return {
    t: i18nextInstance.getFixedT(locale, defaultNS),
    i18n: i18nextInstance,
  };
}
