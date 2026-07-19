import { prisma } from "@rallly/database";

import { createStripeClient } from "../lib/stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

(async function syncSpaceSubscription() {
  let processed = 0;
  let failed = 0;

  const subscriptions = await prisma.subscription.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  console.info(`🚀 Syncing ${subscriptions.length} subscriptions...`);

  for (const subscription of subscriptions) {
    const space = await prisma.space.findFirst({
      where: {
        ownerId: subscription.userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!space) {
      console.info(`Space not found for user ${subscription.userId}`);
      continue;
    }

    try {
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          userId: subscription.userId,
          spaceId: space.id,
        },
      });

      console.info(
        `✅ Space subscription synced for subscription ${subscription.id}`,
      );
      processed++;
    } catch (error) {
      console.error(
        `❌ Failed to sync space subscription for subscription ${subscription.id}:`,
        error,
      );
      failed++;
    }
  }

  console.info(`📊 Sync complete: ${processed} processed, ${failed} failed`);
})();
