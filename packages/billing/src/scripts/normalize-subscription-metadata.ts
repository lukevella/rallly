/**
 * This script will go through all subscriptions and add the userId to the metadata.
 */
import { stripe } from "../lib/stripe";
import { prisma } from "@rallly/database";

async function getSubscriptionsWithMissingMetadata(
  starting_after?: string,
): Promise<string[]> {
  const res: string[] = [];

  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
    starting_after,
  });
  subscriptions.data.forEach((subscription) => {
    if (!subscription.metadata.userId) {
      res.push(subscription.id);
    }
  });
  if (subscriptions.has_more) {
    return [
      ...res,
      ...(await getSubscriptionsWithMissingMetadata(
        subscriptions.data[subscriptions.data.length - 1].id,
      )),
    ];
  } else {
    return res;
  }
}

async function normalizeSubscriptionMetadata() {
  const subscriptions = await getSubscriptionsWithMissingMetadata();

  console.log(
    `Found ${subscriptions.length} subscriptions with missing metadata`,
  );

  for (const subscriptionId of subscriptions) {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
      },
      where: {
        subscriptionId: subscriptionId,
      },
    });

    if (!user) {
      console.log("User not found for subscription", subscriptionId);
      continue;
    }

    await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        userId: user.id,
      },
    });

    console.log("Updated subscription", subscriptionId);
  }
}

normalizeSubscriptionMetadata();
