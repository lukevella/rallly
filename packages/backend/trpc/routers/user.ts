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
  delete: privateProcedure.mutation(async ({ ctx }) => {
    await prisma.$transaction(async (tx) => {
      const polls = await tx.poll.findMany({
        select: { id: true },
        where: { userId: ctx.user.id },
      });
      const pollIds = polls.map((poll) => poll.id);
      await tx.comment.deleteMany({
        where: { pollId: { in: pollIds } },
      });
      await tx.option.deleteMany({
        where: { pollId: { in: pollIds } },
      });
      await tx.participant.deleteMany({
        where: { OR: [{ pollId: { in: pollIds } }, { userId: ctx.user.id }] },
      });
      await tx.watcher.deleteMany({
        where: { OR: [{ pollId: { in: pollIds } }, { userId: ctx.user.id }] },
      });
      await tx.vote.deleteMany({
        where: { pollId: { in: pollIds } },
      });
      await tx.event.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.comment.deleteMany({
        where: { OR: [{ pollId: { in: pollIds } }, { userId: ctx.user.id }] },
      });
      await tx.poll.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.account.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.userPaymentData.deleteMany({
        where: { userId: ctx.user.id },
      });
      await tx.user.delete({
        where: {
          id: ctx.user.id,
        },
      });
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
