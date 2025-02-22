import type { Stripe } from "@rallly/billing";
import { type Prisma, prisma } from "@rallly/database";
import * as Sentry from "@sentry/nextjs";

import { findUserByCustomerId } from "../utils";

export async function onPaymentMethodUpdated(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  // Only handle payment methods that are attached to a customer
  if (!paymentMethod.customer) {
    return;
  }

  try {
    await findUserByCustomerId(paymentMethod.customer as string);

    // Update the payment method data in our database
    await prisma.paymentMethod.update({
      where: {
        id: paymentMethod.id,
      },
      data: {
        type: paymentMethod.type,
        data: paymentMethod[paymentMethod.type] as Prisma.JsonObject,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
