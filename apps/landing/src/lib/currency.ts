import Cookies from "js-cookie";

// Set by the proxy from the request country so the cached pricing page can
// still open in the visitor's currency, and rewritten when the visitor picks
// another one. Shared with the app through the cookie domain so the pay wall
// can honor the same choice.
export const CURRENCY_COOKIE_NAME = "currency";

export const currencyCookieAttributes = {
  path: "/",
  sameSite: "lax",
  domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
  expires: 365,
} as const;

export function readCurrencyCookie() {
  const value = Cookies.get(CURRENCY_COOKIE_NAME);
  return value && /^[a-z]{3}$/.test(value) ? value : undefined;
}

export function writeCurrencyCookie(currency: string) {
  Cookies.set(CURRENCY_COOKIE_NAME, currency, currencyCookieAttributes);
}
