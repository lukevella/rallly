import type { Namespace, i18n } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import { initReactI18next } from "react-i18next/initReactI18next";

import { getOptions } from "./settings";

export const initI18next = async ({
  lng,
  ns,
  middleware,
}: {
  lng: string;
  ns?: Namespace;
  middleware: (i18n: i18n) => void;
}) => {
  const i18nInstance = createInstance().use(initReactI18next).use(ICU);
  middleware(i18nInstance);
  const t = await i18nInstance.init(getOptions(lng, ns));
  return { t, i18n: i18nInstance };
};
