/**
 * The themeable part of an email — the only thing that varies between instance
 * and space branding. The caller passes branding to each `sendXEmail`; the
 * package resolves env constants and hands the template its `chrome` prop.
 */
export type EmailBranding = {
  primaryColor: string;
  logoUrl: string;
  appName: string;
  hideAttribution: boolean;
};

/**
 * Branding + deployment env constants handed to a template as its `chrome`
 * prop. Translation is handled separately by the render-bound `t`/`Trans` from
 * `createEmailI18n`, not carried here.
 */
export type EmailChrome = EmailBranding & {
  baseUrl: string;
  domain: string;
  supportEmail: string;
};
