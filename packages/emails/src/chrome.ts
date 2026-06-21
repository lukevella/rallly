import { absoluteUrl } from "@rallly/utils/absolute-url";

import type { EmailBranding, EmailChrome } from "./types";

/**
 * Resolves the caller's branding plus deployment env constants (base URL,
 * domain, support email) into the `chrome` an email template renders with.
 */
export function resolveChrome(branding: EmailBranding): EmailChrome {
  const url = absoluteUrl();
  return {
    ...branding,
    baseUrl: url,
    domain: url.replace(/(^\w+:|^)\/\//, ""),
    supportEmail: process.env.SUPPORT_EMAIL ?? "",
  };
}
