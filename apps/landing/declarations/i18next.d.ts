import "react-i18next";

import type Blog from "../public/locales/en/blog.json";
import type Common from "../public/locales/en/common.json";
import type Home from "../public/locales/en/home.json";
import type Pricing from "../public/locales/en/pricing.json";

interface I18nNamespaces {
  common: Common;
  home: Home;
  pricing: Pricing;
  blog: Blog;
}

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: I18nNamespaces;
    returnNull: false;
  }
}
