import { prisma } from "@rallly/database";

import { stripe } from "../lib/stripe";

(async function syncSubscriptionData() {
  const BATCH_SIZE = 10;
  let processed = 0;
  let failed = 0;

  const userSubscriptions = await prisma.subscription.findMany({
    select: {
      id: true,
    },
    take: BATCH_SIZE,
  });

  console.info(`🚀 Syncing ${userSubscriptions.length} subscriptions...`)

  for (const userSubscription of userSubscriptions) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        userSubscription.id,
      );

      const subscriptionItem = subscription.items.data[0];
      const interval = subscriptionItem.price.recurring?.interval;

      if (!interval) {
        console.info(`🚨 Missing interval in subscription ${subscription.id}`);
        +        failed++;
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
      processed++;
    } catch (error) {
      console.error(`❌ Failed to sync subscription ${userSubscription.id}:`, error);
      failed++;
    }
  }

  console.info(`📊 Sync complete: ${processed} processed, ${failed} failed`);
})();