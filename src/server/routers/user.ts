import { TRPCError } from "@trpc/server";
import { IronSessionData } from "iron-session";
import { z } from "zod";

import { prisma } from "~/prisma/db";

import { createRouter } from "../createRouter";

const requireUser = (user: IronSessionData["user"]) => {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Tried to access user route without a session",
    });
  }
  return user;
};

export const user = createRouter()
  .query("getPolls", {
    resolve: async ({ ctx }) => {
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
    },
  })
  .mutation("changeName", {
    input: z.object({
      userId: z.string(),
      name: z.string().min(1).max(100),
    }),
    resolve: async ({ input }) => {
      await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          name: input.name,
        },
      });
    },
  });
