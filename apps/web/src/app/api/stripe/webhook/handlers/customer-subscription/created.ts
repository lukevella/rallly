import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";

import {
  getExpandedSubscription,
  getSubscriptionDetails,
  isSubscriptionActive,
  subscriptionMetadataSchema,
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
    throw new Error("Missing user ID");
  }

  const userId = res.data.userId;

  // Check if user already has a subscription
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!existingUser) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // If user already has a subscription, update it or replace it
  if (existingUser.subscription) {
    // Update the existing subscription with new data
    await prisma.subscription.update({
      where: { id: existingUser.subscription.id },
      data: {
        id: subscription.id,
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
      },
    });
  } else {
    // Create a new subscription for the user
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        subscription: {
          create: {
            id: subscription.id,
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
          },
        },
      },
    });
  }
}
