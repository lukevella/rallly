import { prisma } from "@rallly/database";
import z from "zod";

import { publicProcedure, router } from "../trpc";

export const userPreferences = router({
  get: publicProcedure.query(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      return null;
    } else {
      return await prisma.userPreferences.findUnique({
        where: {
          userId: ctx.user.id,
        },
        select: {
          timeZone: true,
          weekStart: true,
          timeFormat: true,
        },
      });
    }
  }),
  update: publicProcedure
    .input(
      z.object({
        timeZone: z.string().optional(),
        weekStart: z.number().min(0).max(6).optional(),
        timeFormat: z.enum(["hours12", "hours24"]).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.isGuest === false) {
        await prisma.userPreferences.upsert({
          where: {
            userId: ctx.user.id,
          },
          create: {
            userId: ctx.user.id,
            ...input,
          },
          update: {
            ...input,
          },
        });
      }
    }),
  delete: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      // delete guest preferences
    } else {
      await prisma.userPreferences.delete({
        where: {
          userId: ctx.user.id,
        },
      });
    }
  }),
});
