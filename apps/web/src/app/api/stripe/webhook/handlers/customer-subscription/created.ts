import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";

import { subscriptionMetadataSchema } from "@/features/subscription/schema";
import {
  getExpandedSubscription,
  getSubscriptionDetails,
  isSubscriptionActive,
  toDate,
} from "../utils";

export async function onCustomerSubscriptionCreated(event: Stripe.Event) {
  const subscription = await getExpandedSubscription(
    (event.data.object as Stripe.Subscription).id,
  );

  const isActive = isSubscriptionActive(subscription);
  const { priceId, currency, interval, amount } =
    getSubscriptionDetails(subscription);

  const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

  if (!res.success) {
    throw new Error("Invalid subscription metadata");
  }

  const userId = res.data.userId;
  const spaceId = res.data.spaceId;

  // If user already has a subscription, update it or replace it
  // Update the existing subscription with new data
  await prisma.subscription.upsert({
    where: { id: subscription.id },
    create: {
      id: subscription.id,
      userId,
      active: isActive,
      priceId,
      currency,
      interval,
      amount,
      status: subscription.status,
      createdAt: toDate(subscription.created),
      periodStart: toDate(subscription.current_period_start),
      periodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      spaceId,
    },
    update: {
      id: subscription.id,
      userId,
      active: isActive,
      priceId,
      currency,
      interval,
      amount,
      status: subscription.status,
      createdAt: toDate(subscription.created),
      periodStart: toDate(subscription.current_period_start),
      periodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      spaceId,
    },
  });
}
