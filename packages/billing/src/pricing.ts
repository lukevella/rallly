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

export const INCLUDED_API_POLLS = 50;

export const API_POLL_TIERS = ["small", "medium", "large", "xlarge"] as const;

export type ApiPollTier = (typeof API_POLL_TIERS)[number];

export function parseApiPollTier(value: string | null | undefined) {
  return API_POLL_TIERS.find((tier) => tier === value) ?? null;
}

// Existing subscribers' limits follow this table. Only ever raise a tier's
// limit; to lower one, add a new tier with new Stripe prices instead.
export const apiPollTierLimits: Record<ApiPollTier, number> = {
  small: 250,
  medium: 500,
  large: 1000,
  xlarge: 2500,
};

const apiPollMonthlyAmounts: Record<
  DisplayedCurrency,
  Record<ApiPollTier, number>
> = {
  usd: { small: 3000, medium: 5000, large: 9000, xlarge: 20000 },
  eur: { small: 2700, medium: 4500, large: 8000, xlarge: 18000 },
  gbp: { small: 2400, medium: 4000, large: 7000, xlarge: 16000 },
};

const ANNUAL_MONTHS_CHARGED = 10;

export const apiPollAddonAmounts = Object.fromEntries(
  displayedCurrencies.map((currency) => [
    currency,
    Object.fromEntries(
      API_POLL_TIERS.map((tier) => {
        const monthly = apiPollMonthlyAmounts[currency][tier];
        return [tier, { monthly, yearly: monthly * ANNUAL_MONTHS_CHARGED }];
      }),
    ),
  ]),
) as Record<
  DisplayedCurrency,
  Record<ApiPollTier, { monthly: number; yearly: number }>
>;

export const apiPollAddonFallback = apiPollAddonAmounts.usd;

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
