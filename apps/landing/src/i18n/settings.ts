import allLanguages from "@rallly/languages";
import type { InitOptions } from "i18next";

export const fallbackLng = "en";
export const languages = Object.keys(allLanguages);
export const defaultNS = "common";

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS,
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
