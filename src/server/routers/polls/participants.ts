import { z } from "zod";

import { prisma } from "~/prisma/db";

import { sendNotification } from "../../../utils/api-utils";
import { createGuestUser } from "../../../utils/auth";
import { createRouter } from "../../createRouter";

export const participants = createRouter()
  .query("list", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      const participants = await prisma.participant.findMany({
        where: {
          pollId,
        },
        include: {
          votes: true,
        },
        orderBy: [
          {
            createdAt: "asc",
          },
          { name: "desc" },
        ],
      });
      return participants;
    },
  })
  .mutation("delete", {
    input: z.object({
      pollId: z.string(),
      participantId: z.string(),
    }),
    resolve: async ({ input: { participantId, pollId } }) => {
      await prisma.participant.delete({
        where: {
          id_pollId: {
            id: participantId,
            pollId: pollId,
          },
        },
      });
    },
  })
  .mutation("add", {
    input: z.object({
      pollId: z.string(),
      name: z.string().nonempty("Participant name is required"),
      votes: z
        .object({
          optionId: z.string(),
          type: z.enum(["yes", "no", "ifNeedBe"]),
        })
        .array(),
    }),
    resolve: async ({ ctx, input: { pollId, votes, name } }) => {
      if (!ctx.session.user) {
        await createGuestUser(ctx.session);
      }

      const participant = await prisma.participant.create({
        data: {
          pollId: pollId,
          name: name,
          userId:
            ctx.session.user?.isGuest === false
              ? ctx.session.user.id
              : undefined,
          guestId:
            ctx.session.user?.isGuest === true
              ? ctx.session.user.id
              : undefined,
          votes: {
            createMany: {
              data: votes.map(({ optionId, type }) => ({
                optionId,
                type,
                pollId: pollId,
              })),
            },
          },
        },
        include: {
          votes: true,
        },
      });

      await sendNotification(pollId, {
        type: "newParticipant",
        participantName: participant.name,
      });

      return participant;
    },
  })
  .mutation("update", {
    input: z.object({
      pollId: z.string(),
      participantId: z.string(),
      name: z.string(),
      votes: z
        .object({
          optionId: z.string(),
          type: z.enum(["yes", "no", "ifNeedBe"]),
        })
        .array(),
    }),
    resolve: async ({ input: { pollId, participantId, votes, name } }) => {
      const participant = await prisma.participant.update({
        where: {
          id_pollId: {
            id: participantId,
            pollId: pollId,
          },
        },
        data: {
          votes: {
            deleteMany: {
              pollId: pollId,
            },
            createMany: {
              data: votes.map(({ optionId, type }) => ({
                optionId,
                type,
                pollId,
              })),
            },
          },
          name,
        },
        include: {
          votes: true,
        },
      });

      return participant;
    },
  });
