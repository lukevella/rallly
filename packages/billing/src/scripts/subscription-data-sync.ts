import { prisma } from "@rallly/database";

import { createStripeClient } from "../lib/stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

(async function syncSubscriptionData() {
  let processed = 0;
  let failed = 0;

  const userSubscriptions = await prisma.subscription.findMany({
    select: {
      id: true,
    },
  });

  console.info(`🚀 Syncing ${userSubscriptions.length} subscriptions...`);

  for (const userSubscription of userSubscriptions) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        userSubscription.id,
        {
          expand: ["items.data.price.currency_options"],
        },
      );
      const currency = subscription.currency;
      const subscriptionItem = subscription.items.data[0];
      const currencyOption =
        subscriptionItem.price.currency_options?.[currency];
      const interval = subscriptionItem.price.recurring?.interval;
      const amount =
        currencyOption?.unit_amount ?? subscriptionItem.price.unit_amount;

      if (!interval) {
        console.info(`🚨 Missing interval in subscription ${subscription.id}`);
        failed++;
        continue;
      }

      if (!amount) {
        console.info(`🚨 Missing amount in subscription ${subscription.id}`);
        failed++;
        continue;
      }

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          amount,
          currency,
        },
      });

      console.info(
        `✅ Subscription ${subscription.id} synced - ${currency}${amount}`,
      );
      processed++;
    } catch (error) {
      console.error(
        `❌ Failed to sync subscription ${userSubscription.id}:`,
        error,
      );
      failed++;
    }
  }

  console.info(`📊 Sync complete: ${processed} processed, ${failed} failed`);
})();
