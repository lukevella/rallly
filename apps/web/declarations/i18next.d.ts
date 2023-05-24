import "react-i18next";

import app from "../public/locales/en/app.json";

interface I18nNamespaces {
  app: typeof app;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "app";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
