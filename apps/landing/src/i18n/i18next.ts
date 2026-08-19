import i18next from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";
import { defaultNS, fallbackLng, languages } from "./settings";

i18next
  .use(initReactI18next)
  .use(ICU)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../../public/locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    supportedLngs: languages,
    fallbackLng,
    lng: undefined, // let detect the language on client side
    fallbackNS: defaultNS,
    defaultNS,
    detection: {
      order: ["path", "htmlTag", "cookie", "navigator"],
    },
    react: {
      // Default list plus b: locales whose statsLast30Days translation still
      // carries the old <b> markup degrade to bold text instead of showing
      // escaped tags; remove once they are re-translated
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p", "b"],
    },
  });

export { i18next };
