import { i18nInstance } from "../i18n";
import { EmailContext } from "../types";

export const defaultEmailContext: EmailContext = {
  logoUrl: "https://rallly-public.s3.amazonaws.com/images/rallly-logo-mark.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
  supportEmail: "support@rallly.co",
  i18n: i18nInstance,
  t: i18nInstance.getFixedT("en"),
};
