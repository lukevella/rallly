import type { Stripe } from "@rallly/billing";
import {
  ADDON_METADATA_KEY,
  API_ADDON,
  getApiPollAddonItem,
  getSeatItem,
} from "@rallly/billing/lib/stripe";
import { billingIntervalSchema } from "@/features/billing/schema";

export function toDate(date: number) {
  return new Date(date * 1000);
}

export function isSubscriptionActive(subscription: Stripe.Subscription) {
  return (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
  );
}

/**
 * Whether this event is the moment the subscription first became paid. A
 * subscription whose first payment needs confirmation (3D Secure, delayed
 * methods) is created `incomplete` and turns active in a later update event, so
 * reading the status from the event payload rather than a refetch makes exactly
 * one of the two events report the start.
 */
export function isActivationEvent(event: Stripe.Event) {
  if (event.type === "customer.subscription.created") {
    return isSubscriptionActive(event.data.object);
  }

  if (event.type === "customer.subscription.updated") {
    const previous = event.data.previous_attributes as
      | Partial<Stripe.Subscription>
      | undefined;
    return (
      previous?.status === "incomplete" &&
      isSubscriptionActive(event.data.object)
    );
  }

  return false;
}

export function getSubscriptionDetails(subscription: Stripe.Subscription) {
  const subscriptionItem = getSeatItem(subscription);

  const interval = subscriptionItem.price.recurring?.interval;
  const currency = subscription.currency;
  const amount =
    subscriptionItem.price.currency_options?.[currency]?.unit_amount ??
    subscriptionItem.price.unit_amount;

  if (!interval) {
    throw new Error(`Missing interval in subscription ${subscription.id}`);
  }

  // Nullish check: unit_amount can legitimately be 0 for free prices
  if (amount == null) {
    throw new Error(`Missing amount in subscription ${subscription.id}`);
  }

  const intervalResult = billingIntervalSchema.safeParse(interval);

  if (!intervalResult.success) {
    throw new Error(`Invalid interval: ${interval}`);
  }

  // Coupons and promotion codes are applied at the invoice level, so they are
  // not reflected in the price's unit_amount. Capture the discount here so the
  // billing UI can show the actual amount the customer is charged. Defaults to
  // null so an ended discount clears the stored values on the next webhook.
  const coupon = subscription.discount?.coupon;

  return {
    interval: intervalResult.data,
    currency,
    amount,
    priceId: subscriptionItem.price.id,
    discountPercentOff: coupon?.percent_off ?? null,
    discountAmountOff: coupon?.amount_off ?? null,
  };
}

export function getApiPollAddonColumns(subscription: Stripe.Subscription) {
  const addon = getApiPollAddonItem(subscription);

  return {
    apiAddonItemId: addon?.id ?? null,
    apiAddonPriceId: addon?.priceId ?? null,
    apiAddonAmount: addon?.amount ?? null,
    apiAddonTier: addon?.tier ?? null,
  };
}

/**
 * True when the subscription carries an API add-on item whose price metadata
 * cannot be read, which would otherwise silently leave the space on the
 * included limit.
 */
export function hasUnreadableApiPollAddon(subscription: Stripe.Subscription) {
  return (
    subscription.items.data.some(
      (item) => item.price?.metadata?.[ADDON_METADATA_KEY] === API_ADDON,
    ) && getApiPollAddonItem(subscription) === null
  );
}

/**
 * The columns the subscription webhooks write, with the seat and the add-on
 * found by price metadata whatever order Stripe lists the items in.
 */
export function toSubscriptionRow(subscription: Stripe.Subscription) {
  const seat = getSeatItem(subscription);

  return {
    ...getSubscriptionDetails(subscription),
    subscriptionItemId: seat.id,
    quantity: seat.quantity ?? 1,
    ...getApiPollAddonColumns(subscription),
  };
}
