import { TRPCError } from "@trpc/server";
import * as z from "zod";

import { getProPrices, getSpaceSubscription } from "@/features/billing/data";
import { createStripeSubscriptionUpdateConfirmation } from "@/features/billing/mutations";
import { isEarlySupporter, resolvePriceSet } from "@/features/billing/utils";
import { getSpaceSeatCount } from "@/features/space/data";
import { router, spaceOwnerProcedure } from "../trpc";

export const billing = router({
  updateSeats: spaceOwnerProcedure
    .input(z.object({ seatDelta: z.int() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await getSpaceSubscription(ctx.space.id);

      if (!subscription || !subscription.active) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "No active subscription found for this space",
        });
      }

      const currentSeats = subscription.quantity;
      const newSeatCount = currentSeats + input.seatDelta;

      if (newSeatCount < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seat count must be at least 1",
        });
      }

      if (input.seatDelta < 0) {
        const currentSeatUsage = await getSpaceSeatCount(ctx.space.id);
        if (newSeatCount < currentSeatUsage) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot reduce seats below current usage of ${currentSeatUsage}. Remove members first to free up seats.`,
          });
        }
      }

      if (!ctx.user.customerId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No customer ID found for space owner",
        });
      }

      const pricing = await getProPrices();
      const priceSet = resolvePriceSet({
        earlySupporter: isEarlySupporter({
          priceId: subscription.priceId,
          pricing,
        }),
        pricing,
      });

      const portalSessionUrl = await createStripeSubscriptionUpdateConfirmation(
        {
          customerId: ctx.user.customerId,
          subscriptionId: subscription.id,
          subscriptionItemId: subscription.subscriptionItemId,
          priceIds: [
            priceSet.monthly.id,
            priceSet.yearly.id,
            subscription.priceId,
          ],
          item: { quantity: newSeatCount },
          returnFlow: "seats",
        },
      );

      return { url: portalSessionUrl };
    }),
});
