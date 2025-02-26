import type { Stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { z } from "zod";

const customerMetadataSchema = z.object({
  userId: z.string(),
});

export async function onCustomerCreated(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  const res = customerMetadataSchema.safeParse(customer.metadata);

  if (!res.success) {
    // If there's no userId in metadata, ignore the event
    return;
  }

  const { userId } = res.data;

  // Update the user with the customer id
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      customerId: customer.id,
    },
  });
}
