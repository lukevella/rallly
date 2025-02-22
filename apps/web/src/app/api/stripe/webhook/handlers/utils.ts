import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { type Prisma, prisma } from "@rallly/database";
import { z } from "zod";

export const subscriptionMetadataSchema = z.object({
  userId: z.string(),
});

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

  return {
    interval,
    currency,
    amount,
    price: subscriptionItem.price,
  };
}

export async function findUserByCustomerId(customerId: string) {
  const user = await prisma.user.findFirst({
    where: {
      customerId,
    },
  });

  if (!user) {
    throw new Error(`No user found for customer ${customerId}`);
  }

  return user;
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
