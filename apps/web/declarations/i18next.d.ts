import "i18next";

import type Emails from "@rallly/emails/locales/emails.json";

import type App from "../public/locales/en/app.json";

interface I18nNamespaces {
  app: App;
  emails: Emails;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "app";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
