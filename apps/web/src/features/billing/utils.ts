import { isBillingEnabled } from "@/features/billing/constants";
import type { SpaceTier } from "@/features/space/schema";

/**
 * The tier a space's paid features are gated on. Without billing there is
 * nothing to pay for, so every space has every paid feature regardless of
 * what the row says. This is the only place that rule is derived.
 */
export function resolveSpaceTier(storedTier: SpaceTier): SpaceTier {
  return isBillingEnabled ? storedTier : "pro";
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
