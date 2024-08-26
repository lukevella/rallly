import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

export const i18nInstance = createInstance();

i18nInstance
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    // debug: true,
    supportedLngs: ["en", "de"],
    fallbackLng: "en",
    defaultNS: "emails",
    ns: "emails",
    preload: ["en", "de"], 
  });
