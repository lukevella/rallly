import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";

import { createOrUpdatePaymentMethod } from "../utils";

export async function onPaymentMethodAttached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  // Only handle payment methods that are attached to a customer
  if (!paymentMethod.customer) {
    return;
  }

  // Find the user associated with this customer
  const user = await prisma.user.findFirst({
    where: {
      customerId: paymentMethod.customer as string,
    },
  });

  if (!user) {
    throw new Error(`No user found for customer ${paymentMethod.customer}`);
  }

  // Upsert the payment method in our database
  await createOrUpdatePaymentMethod(user.id, paymentMethod);
}
