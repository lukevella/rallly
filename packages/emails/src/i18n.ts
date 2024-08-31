import languages from "@rallly/languages";
import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

const i18nInstance = createInstance();

i18nInstance
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    // this flag is crutial so translations are loaded synchronously
    // on the server this would not matter because it's unlikely that an email
    // gets triggered before initialization is done
    // but on the react-email dev server components are rendered completely synchronously
    // and translations would not work without this flag
    initImmediate: false,
    supportedLngs: Object.keys(languages),
    fallbackLng: "en",
    lng: "en",
    ns: ["emails"],
  });

export { i18nInstance };
