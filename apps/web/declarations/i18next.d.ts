import "react-i18next";

import app from "../public/locales/en/app.json";
import timeZones from "../public/locales/en/time-zones.json";

interface I18nNamespaces {
  app: typeof app;
  timeZones: typeof timeZones;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "app";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
