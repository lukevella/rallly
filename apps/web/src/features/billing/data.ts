import "server-only";

import { getProPricing } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { resolveGrandfatheredPricing } from "@/features/billing/utils";
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
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currency: subscription.currency,
    interval: subscription.interval,
    status: subscription.status,
    periodEnd: subscription.periodEnd,
    active: subscription.active,
  };
}

export async function getGrandfatheredPricing(spaceId: string) {
  const subscription = await getSpaceSubscription(spaceId);

  if (!subscription) {
    return null;
  }

  let listPrices: Awaited<ReturnType<typeof getProPricing>>;
  try {
    listPrices = await getProPricing();
  } catch {
    // The banner is informational — never fail the page over a Stripe outage
    return null;
  }

  const grandfathered = resolveGrandfatheredPricing({
    subscription,
    listPrices,
  });

  if (!grandfathered) {
    return null;
  }

  return {
    ...grandfathered,
    quantity: subscription.quantity,
  };
}
