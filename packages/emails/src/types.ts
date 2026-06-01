import type { TFunction } from "i18next";

import type { I18nInstance } from "./i18n";

/**
 * The themeable part of an email — the only thing that varies between instance
 * and space branding. Passed as a prop on every send; the caller decides which
 * to use. (Deployment constants like base URL / support email are resolved by
 * the package from env, not passed.)
 */
export type EmailBranding = {
  primaryColor: string;
  logoUrl: string;
  appName: string;
  hideAttribution: boolean;
};

/**
 * Internal per-render context handed to template components: branding + env
 * constants + a locale-pinned i18n. Assembled inside the package.
 */
export type EmailContext = EmailBranding & {
  baseUrl: string;
  domain: string;
  supportEmail: string;
  i18n: I18nInstance;
  t: TFunction;
  /**
   * Spread into every `<Trans {...ctx.i18nProps} />` to bind it to the email
   * instance, locale-pinned `t`, and the `emails` namespace — so a template
   * can't accidentally resolve a key against the wrong namespace.
   */
  i18nProps: { i18n: I18nInstance; t: TFunction; ns: "emails" };
};
