import type { TFunction } from "i18next";

import { i18nInstance } from "../i18n";

export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
  domain: string;
  supportEmail: string;
  i18n: typeof i18nInstance;
  t: TFunction;
};

export const defaultEmailContext: EmailContext = {
  logoUrl: "https://rallly-public.s3.amazonaws.com/images/rallly-logo-mark.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
  supportEmail: "support@rallly.co",
  i18n: i18nInstance,
  t: i18nInstance.getFixedT("en"),
};
