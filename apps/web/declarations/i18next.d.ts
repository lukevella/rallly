import "i18next";

import type emails from "@rallly/emails/locales/emails.json";

import type app from "../public/locales/en/app.json";

interface I18nNamespaces {
  app: typeof app;
  emails: typeof emails;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "app";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
