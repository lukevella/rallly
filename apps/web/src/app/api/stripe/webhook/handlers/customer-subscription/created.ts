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

export async function onCustomerSubscriptionCreated(event: Stripe.Event) {
  const subscription = await getExpandedSubscription(
    (event.data.object as Stripe.Subscription).id,
  );

  const isActive = isSubscriptionActive(subscription);
  const tier = isActive ? "pro" : "hobby";
  const { priceId, currency, interval, amount } =
    getSubscriptionDetails(subscription);

  const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

  if (!res.success) {
    throw new Error("Invalid subscription metadata");
  }

  const { userId, spaceId } = res.data;

  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error(
      `Missing subscription item in subscription ${subscription.id}`,
    );
  }

  const subscriptionItemId = subscriptionItem.id;
  const quantity = subscriptionItem.quantity ?? 1;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { id: subscription.id },
      create: {
        id: subscription.id,
        userId,
        active: isActive,
        quantity,
        subscriptionItemId,
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
        subscriptionItemId,
        quantity,
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
      include: {
        space: true,
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
    event: "subscription_create",
    properties: {
      interval,
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
