import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { billingIntervalSchema } from "@/features/billing/schema";

export function toDate(date: number) {
  return new Date(date * 1000);
}

export async function getExpandedSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.currency_options"],
  });
}

export function isSubscriptionActive(subscription: Stripe.Subscription) {
  return (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
  );
}

/**
 * Recomputes a space's tier from its subscriptions so the tier reflects whether
 * *any* subscription is active, rather than the state of a single webhook event.
 * Must run after the triggering subscription's `active` flag has been written in
 * the same transaction. Returns the resolved tier.
 */
export async function syncSpaceTier(
  tx: Prisma.TransactionClient,
  spaceId: string,
) {
  const activeSubscription = await tx.subscription.findFirst({
    where: { spaceId, active: true },
    select: { id: true },
  });

  const tier = activeSubscription ? "pro" : "hobby";

  await tx.space.update({
    where: { id: spaceId },
    data: {
      tier,
      ...(tier === "hobby" ? { showBranding: false } : {}),
    },
  });

  return tier;
}

export function getSubscriptionDetails(subscription: Stripe.Subscription) {
  const subscriptionItem = subscription.items.data[0];
  const interval = subscriptionItem.price.recurring?.interval;
  const currency = subscription.currency;
  const amount =
    subscriptionItem.price.currency_options?.[currency]?.unit_amount ??
    subscriptionItem.price.unit_amount;

  if (!interval) {
    throw new Error(`Missing interval in subscription ${subscription.id}`);
  }

  if (!amount) {
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

export async function createOrUpdatePaymentMethod(
  userId: string,
  paymentMethod: Stripe.PaymentMethod,
) {
  await prisma.paymentMethod.upsert({
    where: {
      id: paymentMethod.id,
    },
    create: {
      id: paymentMethod.id,
      userId,
      type: paymentMethod.type,
      data: paymentMethod[paymentMethod.type] as Prisma.JsonObject,
    },
    update: {
      type: paymentMethod.type,
      data: paymentMethod[paymentMethod.type] as Prisma.JsonObject,
    },
  });
}
