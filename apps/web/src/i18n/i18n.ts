import type { Namespace } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { getOptions } from "./settings";

export const initI18next = async ({
  lng,
  ns,
}: {
  lng: string;
  ns?: Namespace;
}) => {
  const i18nInstance = createInstance()
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`../../public/locales/${language}/${namespace}.json`),
      ),
    )
    .use(ICU);
  const t = await i18nInstance.init(getOptions(lng, ns));
  return { t, i18n: i18nInstance };
};
