import { stripe } from "@rallly/billing";
import { getSpaceSubscription } from "@/features/billing/data";
import { getSpaceSeatCount } from "@/features/space/data";
import { AppError } from "@/lib/errors";

export async function updateSeatCount(spaceId: string, delta: number) {
  const seatCount = await getSpaceSeatCount(spaceId);
  const subscription = await getSpaceSubscription(spaceId);

  if (subscription?.tier !== "pro") {
    throw new AppError({
      code: "PAYMENT_REQUIRED",
      message: "No active subscription found for this space",
    });
  }

  try {
    await stripe.subscriptionItems.update(subscription.subscriptionItemId, {
      quantity: seatCount + delta,
      proration_behavior: "create_prorations",
    });
  } catch (error) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update subscription item quantity",
      cause: error,
    });
  }
}
