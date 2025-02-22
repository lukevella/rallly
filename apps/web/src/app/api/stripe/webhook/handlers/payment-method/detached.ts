import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import * as Sentry from "@sentry/nextjs";

export async function onPaymentMethodDetached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  try {
    // Delete the payment method from our database
    await prisma.paymentMethod.delete({
      where: {
        id: paymentMethod.id,
      },
    });
  } catch (error) {
    // If the payment method doesn't exist, that's fine
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return;
    }
    Sentry.captureException(error);
    throw error;
  }
}
