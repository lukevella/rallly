import { i18nDefaultConfig, i18nInstance } from "../i18n";
import { EmailContext } from "../types";

i18nInstance.init({
  ...i18nDefaultConfig,
  initImmediate: true,
});

export const previewEmailContext: EmailContext = {
  logoUrl: "https://rallly-public.s3.amazonaws.com/images/rallly-logo-mark.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
  supportEmail: "support@rallly.co",
  i18n: i18nInstance,
  t: i18nInstance.getFixedT("en"),
};
