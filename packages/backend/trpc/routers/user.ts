import { prisma } from "@rallly/database";
import { z } from "zod";

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
    const user = await prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
      select: {
        subscription: {
          select: {
            active: true,
          },
        },
      },
    });

    if (user?.subscription?.active === true) {
      return {
        active: true,
      };
    }

    const userPaymentData = await prisma.userPaymentData.findUnique({
      where: {
        userId: ctx.user.id,
      },
      select: {
        endDate: true,
      },
    });

    if (
      userPaymentData?.endDate &&
      userPaymentData.endDate.getTime() > Date.now()
    ) {
      return {
        active: true,
        legacy: true,
      };
    }

    return {
      active: false,
    };
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
