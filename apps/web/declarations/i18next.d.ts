import "i18next";

import type emails from "@rallly/emails/locales/emails.json";

import type app from "../public/locales/en/app.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "app";
    returnNull: false;
    resources: {
      app: typeof app;
      emails: typeof emails;
    };
  }
}
