import type { PricingData, ProPrice, Stripe } from "@rallly/billing";
import type { ApiPollTier } from "@rallly/billing/pricing";
import { API_POLL_TIERS, apiPollTierLimits } from "@rallly/billing/pricing";
import { isBillingEnabled } from "@/features/billing/constants";
import type {
  BillingChange,
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

export function isStripeInvalidRequestError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { rawType?: unknown }).rawType === "invalid_request_error"
  );
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

export type ApiPollTierChange = "none" | "upgrade" | "restore" | "downgrade";

/**
 * A downgrade keeps the old limit until renewal without a refund, so moving
 * back up to anything at or below that retained limit is already paid for.
 */
export function classifyApiPollTierChange({
  currentLimit,
  retainedLimit,
  retainedUntil,
  targetLimit,
  now,
}: {
  currentLimit: number | null;
  retainedLimit: number | null;
  retainedUntil: Date | null;
  targetLimit: number | null;
  now: Date;
}): ApiPollTierChange {
  if (targetLimit === currentLimit) {
    return "none";
  }
  if (targetLimit === null) {
    return "downgrade";
  }
  if (currentLimit !== null && targetLimit < currentLimit) {
    return "downgrade";
  }
  const paidUpTo =
    retainedUntil && retainedUntil > now ? (retainedLimit ?? 0) : 0;
  return targetLimit <= paidUpTo ? "restore" : "upgrade";
}

export function canChangeApiPollTier(subscription: {
  active: boolean;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
}) {
  return (
    subscription.active &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    !subscription.cancelAtPeriodEnd
  );
}

type ApiPollAddonPrices = Record<
  ApiPollTier,
  { monthly: ProPrice; yearly: ProPrice }
>;

type BillingChangeError = { error: "currency_unsupported" | "no_change" };

function apiPollTierForLimit(limit: number) {
  const tier = API_POLL_TIERS.find((t) => apiPollTierLimits[t] === limit);
  if (!tier) {
    throw new Error(`No API poll tier has a limit of ${limit}`);
  }
  return tier;
}

function hasCurrency(price: ProPrice, currency: string) {
  return price.amounts[currency] !== undefined;
}

/**
 * The Stripe update for one billing change. Never combines an add-on removal
 * with anything else: `pending_if_incomplete` updates reject `deleted` items.
 */
export function buildSubscriptionUpdate({
  subscription,
  change,
  prices,
  now,
}: {
  subscription: {
    currency: string;
    interval: BillingInterval;
    quantity: number;
    priceId: string;
    subscriptionItemId: string;
    apiAddonItemId: string | null;
    apiPollLimit: number | null;
    apiPollRetainedLimit: number | null;
    apiPollRetainedUntil: Date | null;
  };
  change: BillingChange;
  prices: { pro: PricingLike; apiPollAddon: ApiPollAddonPrices };
  now: Date;
}): Stripe.SubscriptionUpdateParams | BillingChangeError {
  switch (change.type) {
    case "seats": {
      if (change.seatDelta === 0) {
        return { error: "no_change" };
      }
      const quantity = subscription.quantity + change.seatDelta;
      if (quantity < 1) {
        throw new Error("A subscription needs at least one seat");
      }
      return {
        items: [{ id: subscription.subscriptionItemId, quantity }],
        proration_behavior: "always_invoice",
      };
    }
    case "interval": {
      if (subscription.interval === "year") {
        return { error: "no_change" };
      }
      const seatPrice = resolvePriceSet({
        earlySupporter: isEarlySupporter({
          priceId: subscription.priceId,
          pricing: prices.pro,
        }),
        pricing: prices.pro,
      }).yearly;
      const addonPrice =
        subscription.apiAddonItemId && subscription.apiPollLimit !== null
          ? prices.apiPollAddon[apiPollTierForLimit(subscription.apiPollLimit)]
              .yearly
          : null;
      if (
        !hasCurrency(seatPrice, subscription.currency) ||
        (addonPrice && !hasCurrency(addonPrice, subscription.currency))
      ) {
        return { error: "currency_unsupported" };
      }
      const items: Stripe.SubscriptionUpdateParams.Item[] = [
        {
          id: subscription.subscriptionItemId,
          price: seatPrice.id,
          quantity: subscription.quantity,
        },
      ];
      if (subscription.apiAddonItemId && addonPrice) {
        items.push({ id: subscription.apiAddonItemId, price: addonPrice.id });
      }
      return { items, proration_behavior: "always_invoice" };
    }
    case "api_tier": {
      const currentLimit = subscription.apiAddonItemId
        ? subscription.apiPollLimit
        : null;
      const targetLimit = change.tier ? apiPollTierLimits[change.tier] : null;
      const kind = classifyApiPollTierChange({
        currentLimit,
        retainedLimit: subscription.apiPollRetainedLimit,
        retainedUntil: subscription.apiPollRetainedUntil,
        targetLimit,
        now,
      });
      if (kind === "none") {
        return { error: "no_change" };
      }
      if (change.tier === null) {
        if (!subscription.apiAddonItemId) {
          return { error: "no_change" };
        }
        return {
          items: [{ id: subscription.apiAddonItemId, deleted: true }],
          proration_behavior: "none",
        };
      }
      const price =
        prices.apiPollAddon[change.tier][
          subscription.interval === "year" ? "yearly" : "monthly"
        ];
      if (!hasCurrency(price, subscription.currency)) {
        return { error: "currency_unsupported" };
      }
      const item = subscription.apiAddonItemId
        ? { id: subscription.apiAddonItemId, price: price.id }
        : { price: price.id };
      if (kind === "upgrade") {
        return {
          items: [item],
          proration_behavior: "always_invoice",
          payment_behavior: "pending_if_incomplete",
        };
      }
      return { items: [item], proration_behavior: "none" };
    }
  }
}
