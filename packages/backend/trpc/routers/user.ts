import { prisma } from "@rallly/database";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";

export const user = router({
  getBilling: publicProcedure.query(async ({ ctx }) => {
    return await prisma.userPaymentData.findUnique({
      select: {
        subscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlanId: true,
        subscriptionEndDate: true,
        subscriptionUpdateUrl: true,
        subscriptionCancelUrl: true,
      },
      where: {
        userId: ctx.user.id,
      },
    });
  }),
  changeName: publicProcedure
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
