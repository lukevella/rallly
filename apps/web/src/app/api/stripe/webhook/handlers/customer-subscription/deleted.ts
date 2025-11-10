import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { updateSpaceGroup } from "@/features/space/analytics";
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

  const { userId, spaceId } = subscriptionMetadataSchema.parse(
    subscription.metadata,
  );

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

  updateSpaceGroup({
    spaceId,
    properties: {
      tier: "hobby",
    },
  });

  posthog?.capture({
    distinctId: userId,
    event: "subscription cancel",
    properties: {
      $set: {
        tier: "hobby",
      },
    },
    groups: {
      space: spaceId,
    },
  });
}
