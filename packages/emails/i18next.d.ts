import "i18next";

import type Emails from "./locales/en/emails.json";

interface I18nNamespaces {
  emails: Emails;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "emails";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
