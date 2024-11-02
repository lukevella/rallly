import "react-i18next";

import type blog from "../public/locales/en/blog.json";
import type common from "../public/locales/en/common.json";
import type home from "../public/locales/en/home.json";
import type pricing from "../public/locales/en/pricing.json";

interface I18nNamespaces {
  common: typeof common;
  home: typeof home;
  pricing: typeof pricing;
  blog: typeof blog;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
