import type { BillingInterval } from "@/features/billing/schema";

export function resolveGrandfatheredPricing({
  subscription,
  listPrices,
}: {
  subscription: {
    active: boolean;
    amount: number;
    currency: string;
    interval: BillingInterval;
  };
  listPrices: {
    monthly: { amount: number; currency: string };
    yearly: { amount: number; currency: string };
  };
}) {
  if (!subscription.active) {
    return null;
  }

  const listPrice =
    subscription.interval === "month" ? listPrices.monthly : listPrices.yearly;

  if (
    subscription.currency.toLowerCase() !== listPrice.currency.toLowerCase()
  ) {
    return null;
  }

  if (subscription.amount >= listPrice.amount) {
    return null;
  }

  return {
    amount: subscription.amount,
    listAmount: listPrice.amount,
    currency: subscription.currency,
    interval: subscription.interval,
  };
}
