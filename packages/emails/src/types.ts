import type { TFunction } from "i18next";

import type { I18nInstance } from "./i18n";

export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
  domain: string;
  supportEmail: string;
  i18n: I18nInstance;
  t: TFunction;
};
