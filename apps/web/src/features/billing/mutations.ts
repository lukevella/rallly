import { stripe } from "@rallly/billing";
import { getSpaceSubscription } from "@/features/billing/data";
import { getSpaceSeatCount } from "@/features/space/data";
import { AppError } from "@/lib/errors";

export async function increaseSpaceSeatCount(spaceId: string) {
  const subscription = await getSpaceSubscription(spaceId);

  if (!subscription || subscription.tier !== "pro") {
    throw new AppError({
      code: "PAYMENT_REQUIRED",
      message: "You need a Pro subscription to invite members to this space",
    });
  }

  let subscriptionItemId = subscription.subscriptionItemId;

  if (!subscriptionItemId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.id);
      subscriptionItemId = stripeSub.items.data[0].id;
    } catch (error) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve subscription from Stripe",
        cause: error,
      });
    }
  }

  if (!subscriptionItemId) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Expected subscription to have at least one item",
    });
  }

  const seatCount = await getSpaceSeatCount(spaceId);

  try {
    await stripe.subscriptionItems.update(subscriptionItemId, {
      quantity: seatCount + 1,
    });
  } catch (error) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update subscription item quantity",
      cause: error,
    });
  }
}
