import allLanguages from "@rallly/languages";
import type { InitOptions, Namespace } from "i18next";

export const fallbackLng = "en";
export const languages = Object.keys(allLanguages);
export const defaultNS = "common";

export function getOptions(
  lng = fallbackLng,
  ns: Namespace = defaultNS,
): InitOptions {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
