// Set by the proxy from the request country so the cached pricing page can
// still open in the visitor's currency: the page reads it on the client.
export const CURRENCY_COOKIE_NAME = "currency";

export function readCurrencyCookie() {
  if (typeof document === "undefined") {
    return undefined;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CURRENCY_COOKIE_NAME}=([a-z]{3})(?:;|$)`),
  );
  return match?.[1];
}
