import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";

export async function onPaymentMethodDetached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  // Delete the payment method from our database
  await prisma.paymentMethod.delete({
    where: {
      id: paymentMethod.id,
    },
  });
}
