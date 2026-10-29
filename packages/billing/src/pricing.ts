export const PLAN_NAMES = {
  HOBBY: "Hobby",
  PRO: "Pro",
} as const;

export const pricingData = {
  monthly: {
    amount: 1000,
    currency: "usd",
  },
  yearly: {
    amount: 7200,
    currency: "usd",
  },
};

export const displayedCurrencies = ["usd", "eur", "gbp"] as const;

// Set by the landing proxy from the request country and rewritten when the
// visitor picks a currency on the pricing page. Shared with the app through
// the cookie domain so the pay wall opens in the same currency.
export const CURRENCY_COOKIE_NAME = "rallly_currency";

export type DisplayedCurrency = (typeof displayedCurrencies)[number];

export function isDisplayedCurrency(value: string): value is DisplayedCurrency {
  return (displayedCurrencies as readonly string[]).includes(value);
}

// Euro area plus the EFTA and EU countries that price in euros comfortably.
// Nordic and Swiss buyers get EUR rather than USD since we stopped offering
// their own currencies.
const eurCountries = new Set([
  "AT",
  "BE",
  "BG",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

const gbpCountries = new Set(["GB", "GG", "IM", "JE"]);

/**
 * The currency to show a buyer from `country` (ISO 3166-1 alpha-2), limited
 * to what Stripe offers. Anywhere unmapped, unknown, or without its currency
 * on the price falls back to USD, then to whatever is available.
 */
export function getCountryCurrency(
  country: string | undefined,
  available: string[],
) {
  const code = country?.toUpperCase();
  const preferred = code
    ? gbpCountries.has(code)
      ? "gbp"
      : eurCountries.has(code)
        ? "eur"
        : "usd"
    : "usd";
  if (available.includes(preferred)) {
    return preferred;
  }
  return available.includes("usd") ? "usd" : available[0];
}

export function formatMinorUnitAmount({
  amount,
  currency,
  locale,
}: {
  amount: number;
  currency: string;
  locale: string;
}) {
  const code = currency.toUpperCase();
  // Stripe amounts are in the currency's minor unit, which Intl knows: two
  // fraction digits for most currencies, none for JPY and friends.
  const minorUnitDigits =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  const scale = 10 ** minorUnitDigits;
  // Whole amounts drop the fraction ("$10", not "$10.00"); any other amount
  // shows every minor digit ("€5.50", not "€5.5").
  const fractionDigits = amount % scale === 0 ? 0 : minorUnitDigits;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount / scale);
}
