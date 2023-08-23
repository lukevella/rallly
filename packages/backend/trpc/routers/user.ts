import { prisma } from "@rallly/database";
import { z } from "zod";

import { getSubscriptionStatus } from "../../utils/auth";
import { possiblyPublicProcedure, privateProcedure, router } from "../trpc";

export const user = router({
  getBilling: possiblyPublicProcedure.query(async ({ ctx }) => {
    return await prisma.userPaymentData.findUnique({
      select: {
        subscriptionId: true,
        status: true,
        planId: true,
        endDate: true,
        updateUrl: true,
        cancelUrl: true,
      },
      where: {
        userId: ctx.user.id,
      },
    });
  }),
  subscription: possiblyPublicProcedure.query(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      // guest user can't have an active subscription
      return {
        active: false,
      };
    }

    return await getSubscriptionStatus(ctx.user.id);
  }),
  changeName: privateProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
});
