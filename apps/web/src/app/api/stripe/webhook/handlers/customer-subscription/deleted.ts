import type { Stripe } from "@rallly/billing";
import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

const subscriptionMetadataSchema = z.object({
  userId: z.string(),
});

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

  // delete the subscription from the database
  await prisma.subscription.delete({
    where: {
      id: subscription.id,
    },
  });

  try {
    const { userId } = subscriptionMetadataSchema.parse(subscription.metadata);

    posthog?.capture({
      distinctId: userId,
      event: "cancel_subscription",
      properties: {
        $set: {
          tier: "hobby",
        },
      },
    });
  } catch (e) {
    Sentry.captureException(e);
  }
}
