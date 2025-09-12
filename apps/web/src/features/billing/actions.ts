"use server";

import { z } from "zod";
import { getSpaceSubscription } from "@/features/billing/data";
import { createStripeSubscriptionUpdateConfirmation } from "@/features/billing/utils";
import { getSpaceSeatCount } from "@/features/space/data";
import { AppError } from "@/lib/errors";
import { spaceActionClient } from "@/lib/safe-action/server";

export const updateSeatsAction = spaceActionClient
  .metadata({
    actionName: "billing_update_seats",
  })
  .inputSchema(
    z.object({
      seatDelta: z.int(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    // Check if user is the space owner (only owners can manage billing)
    if (ctx.space.ownerId !== ctx.user.id) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Only space owners can manage seat allocation",
      });
    }

    // Get current subscription
    const subscription = await getSpaceSubscription(ctx.space.id);

    if (!subscription || !subscription.active) {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "No active subscription found for this space",
      });
    }

    // Calculate new seat count
    const currentSeats = subscription.quantity;
    const newSeatCount = currentSeats + parsedInput.seatDelta;

    if (newSeatCount < 1) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Seat count must be at least 1",
      });
    }

    // Check if reducing seats below current usage
    if (parsedInput.seatDelta < 0) {
      const currentSeatUsage = await getSpaceSeatCount(ctx.space.id);
      if (newSeatCount < currentSeatUsage) {
        throw new AppError({
          code: "FORBIDDEN",
          message: `Cannot reduce seats below current usage of ${currentSeatUsage}. Remove members first to free up seats.`,
        });
      }
    }

    // Get the space owner's customer ID
    if (!ctx.user.customerId) {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "No customer ID found for space owner",
      });
    }

    try {
      const portalSessionUrl = await createStripeSubscriptionUpdateConfirmation(
        {
          customerId: ctx.user.customerId,
          newSeatCount,
          subscriptionId: subscription.id,
          subscriptionItemId: subscription.subscriptionItemId,
        },
      );

      return {
        portalSessionUrl,
      };
    } catch (error) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create billing portal session",
        cause: error,
      });
    }
  });
