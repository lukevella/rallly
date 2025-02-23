import { type Stripe, stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { z } from "zod";

import { createOrUpdatePaymentMethod } from "../utils";

const checkoutMetadataSchema = z.object({
  userId: z.string(),
});

export async function onCheckoutSessionCompleted(event: Stripe.Event) {
  const checkoutSession = event.data.object as Stripe.Checkout.Session;

  if (checkoutSession.subscription === null) {
    // This is a one-time payment (probably for Rallly Self-Hosted)
    return;
  }

  const { userId } = checkoutMetadataSchema.parse(checkoutSession.metadata);

  if (!userId) {
    return;
  }

  const customerId = checkoutSession.customer as string;

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      customerId,
    },
  });

  const paymentMethods = await stripe.customers.listPaymentMethods(customerId);

  const [paymentMethod] = paymentMethods.data;

  await createOrUpdatePaymentMethod(userId, paymentMethod);

  const subscription = await stripe.subscriptions.retrieve(
    checkoutSession.subscription as string,
  );

  posthog?.capture({
    distinctId: userId,
    event: "upgrade",
    properties: {
      interval: subscription.items.data[0].price.recurring?.interval,
      $set: {
        tier: "pro",
      },
    },
  });
}
