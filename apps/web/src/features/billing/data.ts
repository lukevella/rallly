import "server-only";

import { getProPricing } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
import { paymentMethodCardSchema } from "@/features/billing/schema";
import { getStripe } from "@/features/billing/service";
import type { SpaceTier } from "@/features/space/schema";

export async function getSpaceSubscription(spaceId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      spaceId,
    },
    orderBy: [
      {
        active: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    priceId: subscription.priceId,
    userId: subscription.userId,
    tier: (subscription.active ? "pro" : "hobby") as SpaceTier,
    quantity: subscription.quantity,
    subscriptionItemId: subscription.subscriptionItemId,
    amount: subscription.amount,
    discountPercentOff: subscription.discountPercentOff,
    discountAmountOff: subscription.discountAmountOff,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currency: subscription.currency,
    interval: subscription.interval,
    status: subscription.status,
    periodEnd: subscription.periodEnd,
    active: subscription.active,
  };
}

// Prices change on the order of years; an hour is a compromise between
// picking up a repricing without a deploy and not calling Stripe per render.
// Bump the "-vN" suffix whenever the cached shape changes, so a warm cache
// never deserialises a value in the old shape.
export const getProPrices = unstable_cache(
  async () => getProPricing({ stripe: getStripe() }),
  ["pro-prices-v2"],
  { revalidate: 60 * 60 },
);

/**
 * The customer's stored payment methods, written by the payment_method.*
 * webhooks. `data` holds the type specific object Stripe sends, so a card
 * carries brand, last4 and expiry.
 */
export async function getPaymentMethods(userId: string) {
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return paymentMethods.map((paymentMethod) => {
    const card = paymentMethodCardSchema.safeParse(paymentMethod.data);
    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: card.success ? card.data : null,
    };
  });
}
