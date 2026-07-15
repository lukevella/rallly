export const LOCALE_COOKIE_NAME = "rallly_locale";

// Read via process.env: this module is imported from the proxy (edge) and
// client bundles, where `@/env` is unavailable.
export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
};
