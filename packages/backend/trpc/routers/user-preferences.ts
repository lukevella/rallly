import { prisma } from "@rallly/database";
import z from "zod";

import { publicProcedure, router } from "../trpc";

export const userPreferences = router({
  get: publicProcedure.query(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      return ctx.user.preferences
        ? {
            timeZone: ctx.user.preferences.timeZone ?? null,
            timeFormat: ctx.user.preferences.timeFormat ?? null,
            weekStart: ctx.user.preferences.weekStart ?? null,
          }
        : null;
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
      } else {
        ctx.session.user = {
          ...ctx.user,
          preferences: { ...ctx.user.preferences, ...input },
        };
        await ctx.session.save();
      }
    }),
  delete: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.isGuest) {
      ctx.session.user = {
        ...ctx.user,
        preferences: undefined,
      };
      await ctx.session.save();
    } else {
      await prisma.userPreferences.delete({
        where: {
          userId: ctx.user.id,
        },
      });
    }
  }),
});
