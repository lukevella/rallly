import type { InitOptions } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

const i18nInstance = createInstance();

i18nInstance
  .use(initReactI18next)
  .use(ICU)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  );

const i18nDefaultConfig: InitOptions = {
  lng: "en",
  fallbackLng: "en",
  ns: ["emails"],
  fallbackNS: "emails",
  defaultNS: "emails",
} as const;

export type I18nInstance = typeof i18nInstance;

export { i18nDefaultConfig, i18nInstance };
