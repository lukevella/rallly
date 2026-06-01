import { i18nDefaultConfig, i18nInstance } from "../i18n";
import type { EmailContext } from "../types";

i18nInstance.init({
  ...i18nDefaultConfig,
  initAsync: true,
});

export const previewEmailContext: EmailContext = {
  logoUrl: "https://d39ixtfgglw55o.cloudfront.net/images/rallly-logo-mark.png",
  baseUrl: "https://rallly.co",
  domain: "rallly.co",
  supportEmail: "support@rallly.co",
  i18n: i18nInstance,
  t: i18nInstance.getFixedT("en"),
  appName: "Rallly",
  primaryColor: "#4f46e5",
  hideAttribution: false,
  i18nProps: {
    i18n: i18nInstance,
    t: i18nInstance.getFixedT("en"),
    ns: "emails",
  },
};
