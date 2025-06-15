import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";

import { getDefaultSpace, getSpace } from "@/features/spaces/queries";
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
    throw new Error("Missing user ID");
  }

  const userId = res.data.userId;

  // Check if user already has a subscription
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscription: true,
    },
  });

  if (!existingUser) {
    throw new Error(`User with ID ${userId} not found`);
  }

  let spaceId: string;

  // The space should be in the metadata,
  // but if it's not, we fallback to the default space.
  // This is temporary while we haven't run a data migration
  // to add the spaceId to the metadata for all existing subscriptions
  if (res.data.spaceId) {
    const space = await getSpace({ id: res.data.spaceId });
    if (!space) {
      throw new Error(`Space with ID ${res.data.spaceId} not found`);
    }

    if (space.ownerId !== userId) {
      throw new Error(
        `Space with ID ${res.data.spaceId} does not belong to user ${userId}`,
      );
    }

    spaceId = space.id;
  } else {
    // TODO: Remove this fallback once all subscriptions have
    // a spaceId in their metadata
    const space = await getDefaultSpace({ ownerId: userId });

    if (!space) {
      throw new Error(`Default space with owner ID ${userId} not found`);
    }

    spaceId = space.id;
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
        spaceId,
      },
    });
  } else {
    // Create a new subscription for the user
    await prisma.subscription.create({
      data: {
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
}
