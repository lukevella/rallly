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

/**
 * Initialises the email i18n instance for `locale` and returns the instance
 * plus a locale-pinned `t`. `getFixedT(locale)` is concurrency-safe even though
 * the instance is shared — it captures the locale regardless of the instance's
 * current `language`. (Whether to swap the shared singleton for a per-send
 * `createInstance()` is tracked in RAL-1219.)
 */
export async function createEmailI18n(locale: string) {
  await i18nInstance.init({ ...i18nDefaultConfig, lng: locale });
  return { i18n: i18nInstance, t: i18nInstance.getFixedT(locale) };
}

export { i18nDefaultConfig, i18nInstance };
