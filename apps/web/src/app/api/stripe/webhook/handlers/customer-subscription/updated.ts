import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";

import { subscriptionMetadataSchema } from "@/features/subscription/schema";
import {
  getExpandedSubscription,
  getSubscriptionDetails,
  isSubscriptionActive,
  toDate,
} from "../utils";

export async function onCustomerSubscriptionUpdated(event: Stripe.Event) {
  if (event.type !== "customer.subscription.updated") {
    return;
  }

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

  // Update the subscription in the database
  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      active: isActive,
      priceId,
      currency,
      interval,
      amount,
      status: subscription.status,
      periodStart: toDate(subscription.current_period_start),
      periodEnd: toDate(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  posthog?.capture({
    distinctId: res.data.userId,
    event: "subscription change",
    properties: {
      type: event.type,
      $set: {
        tier: isActive ? "pro" : "hobby",
      },
    },
  });
}
