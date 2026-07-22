import type { Stripe } from "@rallly/billing";
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

export function getSubscriptionDetails(subscription: Stripe.Subscription) {
  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error(
      `Missing subscription item in subscription ${subscription.id}`,
    );
  }

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
