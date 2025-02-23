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

  // Create the subscription in the database
  await prisma.subscription.create({
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
    },
  });

  // Update the user with the subscription id
  await prisma.user.update({
    where: {
      id: res.data.userId,
    },
    data: {
      subscriptionId: subscription.id,
    },
  });
}
