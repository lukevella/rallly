import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { waitUntil } from "@vercel/functions";
import { PostHogClient } from "@/features/analytics/posthog";
import { subscriptionMetadataSchema } from "@/features/subscription/schema";

export async function onCustomerSubscriptionDeleted(event: Stripe.Event) {
  const subscription = await stripe.subscriptions.retrieve(
    (event.data.object as Stripe.Subscription).id,
  );

  // void any unpaid invoices
  const invoices = await stripe.invoices.list({
    subscription: subscription.id,
    status: "open",
  });

  for (const invoice of invoices.data) {
    await stripe.invoices.voidInvoice(invoice.id);
  }

  const res = subscriptionMetadataSchema.safeParse(subscription.metadata);

  if (!res.success) {
    throw new Error("Invalid subscription metadata");
  }

  const { userId, spaceId } = res.data;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        active: false,
        status: "canceled",
      },
    });

    await tx.space.update({
      where: {
        id: spaceId,
      },
      data: {
        tier: "hobby",
      },
    });
  });

  const posthog = PostHogClient();

  posthog?.groupIdentify({
    groupType: "space",
    groupKey: spaceId,
    properties: {
      tier: "hobby",
    },
  });

  posthog?.capture({
    distinctId: userId,
    event: "subscription_cancel",
    properties: {
      $set: {
        tier: "hobby",
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
