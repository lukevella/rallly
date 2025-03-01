import type { Namespace } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { defaultNS, getOptions } from "./settings";

const initI18next = async (lng: string, ns: Namespace) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(ICU)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`../../public/locales/${language}/${namespace}.json`),
      ),
    )
    .init(getOptions(lng, ns));
  return i18nInstance;
};

export async function getTranslation<Ns extends Namespace>(
  locale: string,
  ns?: Ns,
) {
  const fixedNs = ns ?? defaultNS;
  const i18nextInstance = await initI18next(locale, fixedNs);
  return {
    t: i18nextInstance.getFixedT<Ns>(locale),
    i18n: i18nextInstance,
  };
}
