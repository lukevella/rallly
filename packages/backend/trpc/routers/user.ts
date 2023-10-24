import { prisma } from "@rallly/database";
import { z } from "zod";

import { getSubscriptionStatus } from "../../utils/auth";
import {
  possiblyPublicProcedure,
  privateProcedure,
  publicProcedure,
  router,
} from "../trpc";

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
  getByEmail: publicProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ input }) => {
      return await prisma.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          name: true,
          email: true,
        },
      });
    }),
  subscription: possiblyPublicProcedure.query(
    async ({ ctx }): Promise<{ legacy?: boolean; active: boolean }> => {
      if (ctx.user.isGuest) {
        // guest user can't have an active subscription
        return {
          active: false,
        };
      }

      return await getSubscriptionStatus(ctx.user.id);
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
  updatePreferences: privateProcedure
    .input(
      z.object({
        locale: z.string().optional(),
        timeZone: z.string().optional(),
        weekStart: z.number().min(0).max(6).optional(),
        timeFormat: z.enum(["hours12", "hours24"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.isGuest === false) {
        await prisma.user.update({
          where: {
            id: ctx.user.id,
          },
          data: input,
        });
      }
    }),
});
