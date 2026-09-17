import type { PricingData, ProPrice } from "@rallly/billing";
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

export function isStripeErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export function isStripeResourceMissingError(error: unknown) {
  return isStripeErrorCode(error, "resource_missing");
}

type PricingLike = Pick<PricingData, "monthly" | "yearly" | "earlySupporter">;

/**
 * A subscriber whose price is not one of the two current list prices keeps
 * that price for life. Only meaningful once the early supporter prices exist
 * in Stripe; before the rollout everyone is on a current price by definition.
 */
export function isEarlySupporter({
  priceId,
  pricing,
}: {
  priceId: string;
  pricing: PricingLike | null;
}) {
  if (!pricing?.earlySupporter) {
    return false;
  }
  return priceId !== pricing.monthly.id && priceId !== pricing.yearly.id;
}

/** The monthly/yearly pair a subscriber may move between without repricing. */
export function resolvePriceSet({
  earlySupporter,
  pricing,
}: {
  earlySupporter: boolean;
  pricing: PricingLike;
}): { monthly: ProPrice; yearly: ProPrice } {
  if (earlySupporter && pricing.earlySupporter) {
    return pricing.earlySupporter;
  }
  return { monthly: pricing.monthly, yearly: pricing.yearly };
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
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  // Stripe amounts are in the currency's minor unit, which Intl knows: two
  // fraction digits for most currencies, none for JPY and friends.
  const minorUnitDigits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(amount / 10 ** minorUnitDigits);
}
