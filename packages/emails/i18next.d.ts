import "i18next";

import emails from "./locales/en/emails.json";

interface I18nNamespaces {
  emails: typeof emails;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "emails";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
