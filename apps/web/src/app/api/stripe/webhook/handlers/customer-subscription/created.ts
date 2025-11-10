import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { updateSpaceGroup } from "@/features/space/analytics";
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

  const subscriptionItem = subscription.items.data[0];

  if (!subscriptionItem) {
    throw new Error(
      `Missing subscription item in subscription ${subscription.id}`,
    );
  }

  const subscriptionItemId = subscriptionItem.id;
  const quantity = subscriptionItem.quantity ?? 1;
  // If user already has a subscription, update it or replace it
  // Update the existing subscription with new data
  const { subscription: updatedSubscription, hasActiveSubscription } =
    await prisma.$transaction(async (tx) => {
      if (isActive && spaceId) {
        await tx.subscription.updateMany({
          where: {
            spaceId,
            active: true,
            NOT: {
              id: subscription.id,
            },
          },
          data: {
            active: false,
          },
        });
      }

      const subscriptionRecord = await tx.subscription.upsert({
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

      if (spaceId) {
        const activeSubscription = await tx.subscription.findFirst({
          where: {
            spaceId,
            active: true,
          },
          select: {
            id: true,
          },
        });

        await tx.space.update({
          where: {
            id: spaceId,
          },
          data: {
            tier: activeSubscription ? "pro" : "hobby",
          },
        });

        return {
          subscription: subscriptionRecord,
          hasActiveSubscription: Boolean(activeSubscription),
        };
      }

      return {
        subscription: subscriptionRecord,
        hasActiveSubscription: subscriptionRecord.active,
      };
    });

  if (updatedSubscription.space) {
    const space = await prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId,
      },
    });

    updateSpaceGroup({
      spaceId,
      properties: {
        name: space?.name,
        seatCount: quantity,
        tier: hasActiveSubscription ? "pro" : "hobby",
      },
    });

    posthog?.capture({
      distinctId: userId,
      uuid: event.id,
      event: "upgrade",
      properties: {
        interval,
        $set: {
          tier: hasActiveSubscription ? "pro" : "hobby",
        },
      },
      groups: {
        space: spaceId,
      },
    });
  } else {
    console.error("Failed to update space group on subscription.created", {
      eventId: event.id,
      subscriptionId: subscription.id,
      spaceId: spaceId,
    });
  }
}
