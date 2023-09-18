import { prisma } from "@rallly/database";
import { z } from "zod";

import { getUserInfo } from "../../utils/auth";
import {
  possiblyPublicProcedure,
  privateProcedure,
  publicProcedure,
  router,
} from "../trpc";

export const user = router({
  whoAmI: publicProcedure.query(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      return {
        isGuest: true as const,
        id: ctx.user.id,
        hasActiveSubscription: false,
        legacyBilling: false,
      };
    }

    const userInfo = await getUserInfo(ctx.user.id);

    return {
      isGuest: false as const,
      ...userInfo,
    };
  }),
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
  /**
   * TODO (Luke Vella) [2023-09-18]: Can be removed after some time
   * @deprecated
   */
  subscription: possiblyPublicProcedure.query(
    async ({ ctx }): Promise<{ legacy?: boolean; active: boolean }> => {
      if (ctx.user.isGuest) {
        // guest user can't have an active subscription
        return {
          active: false,
        };
      }

      const userInfo = await getUserInfo(ctx.user.id);

      return {
        active: userInfo.hasActiveSubscription,
        legacy: userInfo.legacyBilling,
      };
    },
  ),
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
