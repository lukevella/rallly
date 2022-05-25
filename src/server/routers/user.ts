import { TRPCError } from "@trpc/server";
import { IronSessionData } from "iron-session";

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
              links: {
                where: {
                  role: "admin",
                },
              },
            },
            take: 5,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
      return userPolls;
    },
  })
  .query("getParticipants", {
    resolve: async ({ ctx }) => {
      const user = requireUser(ctx.session.user);
      const participants = await prisma.participant.findMany({
        where: {
          guestId: user.isGuest ? user.id : undefined,
          userId: !user.isGuest ? user.id : undefined,
        },
        select: {
          name: true,
          poll: {
            select: {
              title: true,
              links: {
                where: {
                  role: "participant",
                },
              },
            },
          },
        },
      });

      return participants;
    },
  });
