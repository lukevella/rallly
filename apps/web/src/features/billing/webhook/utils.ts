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

  return {
    interval: intervalResult.data,
    currency,
    amount,
    priceId: subscriptionItem.price.id,
  };
}
