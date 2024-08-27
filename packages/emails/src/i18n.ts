import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import languages from "@rallly/languages";

// on the react-email dev server use an env var to control the language
const isDevServer = process.argv[1].endsWith("node_modules/.bin/email")
const initialLng = isDevServer ? (process.env.REACT_EMAIL_LANG ?? 'en') : 'en'

const instance = createInstance();

instance
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    // this flag is crutial so translations are loaded synchronously
    // on the server this would not matter because it's unlikely that an email
    // gets triggered before initizialization is done
    // but on the react-email dev server components are rendered completely synchronously
    // and translations would not work without this flag
    initImmediate: false,
    supportedLngs: Object.keys(languages),
    fallbackLng: "en",
    lng: initialLng,
    ns: "emails",
  });

export const i18nInstance = instance