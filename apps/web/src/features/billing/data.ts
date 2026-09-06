import "server-only";

import { getProPricing } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
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
export const getProPrices = unstable_cache(
  async () => {
    const { currencies } = await getProPricing({ stripe: getStripe() });
    return currencies;
  },
  ["pro-prices"],
  { revalidate: 60 * 60 },
);
