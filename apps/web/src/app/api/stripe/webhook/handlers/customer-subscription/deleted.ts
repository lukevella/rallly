import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { subscriptionMetadataSchema } from "@/features/subscription/schema";

export async function onCustomerSubscriptionDeleted(event: Stripe.Event) {
  const subscription = await stripe.subscriptions.retrieve(
    (event.data.object as Stripe.Subscription).id,
  );

  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      id: subscription.id,
    },
    select: {
      spaceId: true,
    },
  });

  // void any unpaid invoices
  const invoices = await stripe.invoices.list({
    subscription: subscription.id,
    status: "open",
  });

  for (const invoice of invoices.data) {
    await stripe.invoices.voidInvoice(invoice.id);
  }

  // delete the subscription from the database
  await prisma.subscription.delete({
    where: {
      id: subscription.id,
    },
  });

  let hasActiveSubscription = false;

  if (existingSubscription?.spaceId) {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        spaceId: existingSubscription.spaceId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    hasActiveSubscription = Boolean(activeSubscription);

    await prisma.space.update({
      where: {
        id: existingSubscription.spaceId,
      },
      data: {
        tier: activeSubscription ? "pro" : "hobby",
      },
    });
  }

  const { userId } = subscriptionMetadataSchema.parse(subscription.metadata);

  posthog?.capture({
    distinctId: userId,
    event: "subscription cancel",
    properties: {
      $set: {
        tier: hasActiveSubscription ? "pro" : "hobby",
      },
    },
  });
}
