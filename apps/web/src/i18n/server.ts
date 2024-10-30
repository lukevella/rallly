import type { Namespace } from "i18next";

import { defaultNS } from "@/i18n/settings";

import { initI18next } from "./i18n";

export async function getTranslation(
  locale: string,
  ns: Namespace = defaultNS,
) {
  const i18nextInstance = await initI18next(locale, ns);
  return {
    t: i18nextInstance.getFixedT(locale, Array.isArray(ns) ? ns[0] : ns),
    i18n: i18nextInstance,
  };
}
