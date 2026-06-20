import type { InitOptions } from "i18next";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

const i18nDefaultConfig: InitOptions = {
  lng: "en",
  fallbackLng: "en",
  ns: ["emails"],
  fallbackNS: "emails",
  defaultNS: "emails",
} as const;

/**
 * Builds a fresh, locale-bound i18n instance for a single email render and
 * returns it with a locale-pinned `t`. Each email calls this with its `locale`
 * prop and localizes with `t(...)`; pass `t` + `i18n` to `<Trans>` (from
 * react-i18next/TransWithoutContext) for the few strings with inline markup.
 *
 * A fresh per-render instance (not a shared singleton) keeps `i18n.language`
 * correct under a concurrent fan-out, and TransWithoutContext keeps it free of
 * React context, which Next disallows in the server components that send email.
 */
export async function createEmailI18n(locale: string) {
  const i18n = createInstance();
  await i18n
    .use(ICU)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`../locales/${language}/${namespace}.json`),
      ),
    )
    .use(initReactI18next)
    .init({ ...i18nDefaultConfig, lng: locale });

  return { i18n, t: i18n.getFixedT(locale, "emails") };
}
