import type { PricingData, ProPrice } from "@rallly/billing";
import { isBillingEnabled } from "@/features/billing/constants";
import type {
  BillingInterval,
  SubscriptionStatus,
} from "@/features/billing/schema";
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
  const code = currency.toUpperCase();
  // Stripe amounts are in the currency's minor unit, which Intl knows: two
  // fraction digits for most currencies, none for JPY and friends.
  const minorUnitDigits =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  // Whole amounts render without trailing zeros ("$10", not "$10.00").
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: minorUnitDigits,
  }).format(amount / 10 ** minorUnitDigits);
}

/**
 * A subscription that renews and can therefore change billing interval.
 * `past_due` is stored as active (Stripe keeps retrying), but its next
 * invoice is unpaid, so a plan change there would compound the problem.
 */
export function canChangeBillingInterval(subscription: {
  active: boolean;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  interval: BillingInterval;
}) {
  return (
    subscription.active &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    !subscription.cancelAtPeriodEnd &&
    // Yearly to monthly would need a schedule to let the paid year run out.
    subscription.interval === "month"
  );
}
