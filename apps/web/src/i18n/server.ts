import resourcesToBackend from "i18next-resources-to-backend";

import { defaultNS } from "@/i18n/settings";

import { initI18next } from "./i18n";
import { getLocale } from "./server/get-locale";

export async function getTranslation(localeOverride?: string) {
  const locale = localeOverride || getLocale();
  const { i18n } = await initI18next({
    lng: locale,
    middleware: (i18n) => {
      i18n.use(
        resourcesToBackend(
          (language: string, namespace: string) =>
            import(`../../public/locales/${language}/${namespace}.json`),
        ),
      );
    },
  });
  return {
    t: i18n.getFixedT(locale, defaultNS),
    i18n,
  };
}
