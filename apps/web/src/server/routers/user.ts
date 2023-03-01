import { TRPCError } from "@trpc/server";
import { IronSessionData } from "iron-session";
import { z } from "zod";

import { prisma } from "@/utils/prisma";

import { publicProcedure, router } from "../trpc";

const requireUser = (user: IronSessionData["user"]) => {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tried to access user route without a session",
    });
  }
  return user;
};

export const user = router({
  getPolls: publicProcedure.query(async ({ ctx }) => {
    const user = requireUser(ctx.session.user);
    const userPolls = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        polls: {
          where: {
            deleted: false,
          },
          select: {
            title: true,
            closed: true,
            verified: true,
            createdAt: true,
            adminUrlId: true,
          },
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    return userPolls;
  }),
  changeName: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          name: input.name,
        },
      });
    }),
});
