import { prisma } from "@rallly/database";

import { stripe } from "../lib/stripe";

export async function syncSubscriptionData() {
  const userSubscriptions = await prisma.subscription.findMany({
    select: {
      id: true,
    },
  });

  console.info(`🚀 Syncing ${userSubscriptions.length} subscriptions...`)

  for (const userSubscription of userSubscriptions) {
    const subscription = await stripe.subscriptions.retrieve(
      userSubscription.id,
    );

    const subscriptionItem = subscription.items.data[0];

    const interval = subscriptionItem.price.recurring?.interval;

    if (!interval) {
      console.info(`🚨 Missing interval in subscription ${subscription.id}`);
      continue;
    }

    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        amount: subscriptionItem.price.unit_amount,
        currency: subscriptionItem.price.currency,
        interval: subscriptionItem.price.recurring?.interval,
        status: subscription.status,
      },
    });

    console.info(`✅ Subscription ${subscription.id} synced`);
  }
}

syncSubscriptionData();