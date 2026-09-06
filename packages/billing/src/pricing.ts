export const pricingData = {
  monthly: {
    amount: 700,
    currency: "usd",
  },
  yearly: {
    amount: 5600,
    currency: "usd",
  },
};

export function yearlySavingsPercent({
  monthly,
  yearly,
}: {
  monthly: number;
  yearly: number;
}) {
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

export const displayedCurrencies = ["usd", "eur", "gbp"] as const;

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
