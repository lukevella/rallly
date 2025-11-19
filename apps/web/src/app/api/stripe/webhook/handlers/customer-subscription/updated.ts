import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { waitUntil } from "@vercel/functions";
import { PostHogClient } from "@/features/analytics/posthog";
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

  const { userId, spaceId } = res.data;

  const tier = isActive ? "pro" : "hobby";

  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error("Expected subscription to have one item");
  }

  const subscriptionItemId = subscriptionItem.id;
  const quantity = subscriptionItem.quantity ?? 1;

  // Update the subscription in the database
  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: {
        id: subscription.id,
      },
      update: {
        active: isActive,
        priceId,
        currency,
        interval,
        subscriptionItemId,
        quantity,
        amount,
        status: subscription.status,
        periodStart: toDate(subscription.current_period_start),
        periodEnd: toDate(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        id: subscription.id,
        userId,
        spaceId,
        active: isActive,
        priceId,
        currency,
        interval,
        subscriptionItemId,
        quantity,
        amount,
        status: subscription.status,
        periodStart: toDate(subscription.current_period_start),
        periodEnd: toDate(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await tx.space.update({
      where: {
        id: spaceId,
      },
      data: {
        tier,
      },
    });
  });

  const posthog = PostHogClient();

  posthog?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      seatCount: quantity,
      tier,
    },
  });

  posthog?.capture({
    distinctId: userId,
    uuid: event.id,
    event: "subscription_update",
    properties: {
      interval,
      quantity,
      $set: {
        tier,
      },
    },
    groups: {
      space: spaceId,
    },
  });

  if (posthog) {
    waitUntil(posthog.shutdown());
  }
}
