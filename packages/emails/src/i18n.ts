import { createInstance, Namespace } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

const initI18next = async (lng: string, ns: Namespace) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
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
      lng,
      fallbackNS: "emails",
      defaultNS: "emails",
      ns,
    });
  return i18nInstance;
};

export async function getTranslation(locale: string, ns: Namespace = "en") {
  const i18nextInstance = await initI18next(locale, ns);
  return {
    t: i18nextInstance.getFixedT(locale, Array.isArray(ns) ? ns[0] : ns),
    i18n: i18nextInstance,
  };
}
