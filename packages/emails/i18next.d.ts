import "i18next";

import type emails from "./locales/en/emails.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "emails";
    resources: {
      emails: typeof emails;
    };
    returnNull: false;
  }
}
