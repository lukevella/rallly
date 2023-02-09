import { z } from "zod";

import { prisma } from "~/prisma/db";

import { sendNotification } from "../../../utils/api-utils";
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
            createdAt: "desc",
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
    resolve: async ({ input: { participantId } }) => {
      await prisma.participant.delete({
        where: {
          id: participantId,
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
      const user = ctx.session.user;
      const participant = await prisma.participant.create({
        data: {
          pollId: pollId,
          name: name,
          userId: user.id,
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
      votes: z
        .object({
          optionId: z.string(),
          type: z.enum(["yes", "no", "ifNeedBe"]),
        })
        .array(),
    }),
    resolve: async ({ input: { pollId, participantId, votes } }) => {
      const participant = await prisma.participant.update({
        where: {
          id: participantId,
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
        },
        include: {
          votes: true,
        },
      });

      return participant;
    },
  });
