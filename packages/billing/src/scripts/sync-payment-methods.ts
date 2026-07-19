import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";

import { createStripeClient } from "../lib/stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = createStripeClient({ secretKey });

(async function syncPaymentMethods() {
  let processed = 0;
  let failed = 0;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      customerId: true,
      email: true,
    },
    where: {
      customerId: {
        not: null,
      },
    },
  });

  console.info(`🚀 Syncing ${users.length} users...`);

  for (const user of users) {
    if (!user.customerId) continue;
    try {
      const paymentMethods = await stripe.customers.listPaymentMethods(
        user.customerId,
      );

      await prisma.paymentMethod.createMany({
        data: paymentMethods.data.map((paymentMethod) => ({
          id: paymentMethod.id,
          userId: user.id,
          type: paymentMethod.type,
          data: paymentMethod[paymentMethod.type] as Prisma.JsonObject,
        })),
      });

      console.info(`✅ Payment methods synced for user ${user.email}`);
      processed++;
    } catch (error) {
      console.error(
        `❌ Failed to sync payment methods for user ${user.email}:`,
        error,
      );
      failed++;
    }
  }

  console.info(`📊 Sync complete: ${processed} processed, ${failed} failed`);
})();
