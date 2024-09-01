import "i18next";

import emails from "@rallly/emails/locales/emails.json";

import app from "../public/locales/en/app.json";

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
