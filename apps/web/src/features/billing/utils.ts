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

const tierLimit = (tier: ApiPollTier | null) =>
  tier ? apiPollTierLimits[tier] : 0;

/**
 * A downgrade keeps the old tier until renewal without a refund, so moving
 * back up to anything at or below that retained tier is already paid for.
 * `null` is no add-on.
 */
export function classifyApiPollTierChange({
  currentTier,
  retainedTier,
  retainedUntil,
  targetTier,
  now,
}: {
  currentTier: ApiPollTier | null;
  retainedTier: ApiPollTier | null;
  retainedUntil: Date | null;
  targetTier: ApiPollTier | null;
  now: Date;
}): ApiPollTierChange {
  if (targetTier === currentTier) {
    return "none";
  }
  const target = tierLimit(targetTier);
  if (target < tierLimit(currentTier)) {
    return "downgrade";
  }
  const paidUpTo =
    retainedUntil && retainedUntil > now ? tierLimit(retainedTier) : 0;
  return target <= paidUpTo ? "restore" : "upgrade";
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

/**
 * The stored tier, falling back to the price id for a row written before the
 * tier column existed.
 */
function findApiPollTier({
  tier,
  priceId,
  prices,
}: {
  tier: ApiPollTier | null;
  priceId: string | null;
  prices: ApiPollAddonPrices;
}) {
  return (
    tier ??
    API_POLL_TIERS.find(
      (candidate) =>
        prices[candidate].monthly.id === priceId ||
        prices[candidate].yearly.id === priceId,
    ) ??
    null
  );
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
    apiAddonPriceId: string | null;
    apiAddonTier: ApiPollTier | null;
    apiPollRetainedTier: ApiPollTier | null;
    apiPollRetainedUntil: Date | null;
    periodEnd: Date;
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
        payment_behavior: "pending_if_incomplete",
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
      let addonPrice: ProPrice | null = null;
      if (subscription.apiAddonItemId) {
        const tier = findApiPollTier({
          tier: subscription.apiAddonTier,
          priceId: subscription.apiAddonPriceId,
          prices: prices.apiPollAddon,
        });
        if (!tier) {
          throw new Error(
            `API add-on price ${subscription.apiAddonPriceId} matches no tier`,
          );
        }
        addonPrice = prices.apiPollAddon[tier].yearly;
      }
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
      return {
        items,
        proration_behavior: "always_invoice",
        payment_behavior: "pending_if_incomplete",
      };
    }
    case "api_tier": {
      const currentTier = subscription.apiAddonItemId
        ? findApiPollTier({
            tier: subscription.apiAddonTier,
            priceId: subscription.apiAddonPriceId,
            prices: prices.apiPollAddon,
          })
        : null;
      // A retained tier was paid for up to the period end it was set at. Once
      // the period moves (renewal, or a switch to yearly) it covers none of it.
      const retainedUntil =
        subscription.apiPollRetainedUntil &&
        subscription.apiPollRetainedUntil >= subscription.periodEnd
          ? subscription.apiPollRetainedUntil
          : null;
      const kind = classifyApiPollTierChange({
        currentTier,
        retainedTier: subscription.apiPollRetainedTier,
        retainedUntil,
        targetTier: change.tier,
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
