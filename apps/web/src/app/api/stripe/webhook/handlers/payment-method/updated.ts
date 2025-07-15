import type { Stripe } from "@rallly/billing";
import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";

export async function onPaymentMethodUpdated(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;

  if (!paymentMethod.customer) {
    return;
  }

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
}
