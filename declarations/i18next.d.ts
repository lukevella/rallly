import "react-i18next";

import app from "~/public/locales/en/app.json";
import common from "~/public/locales/en/common.json";
import errors from "~/public/locales/en/errors.json";
import homepage from "~/public/locales/en/homepage.json";

interface I18nNamespaces {
  homepage: typeof homepage;
  app: typeof app;
  common: typeof common;
  errors: typeof errors;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
