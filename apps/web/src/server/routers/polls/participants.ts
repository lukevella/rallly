import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import { absoluteUrl } from "@rallly/utils";
import { z } from "zod";

import { sendNotification } from "../../../utils/api-utils";
import { createToken } from "../../../utils/auth";
import { publicProcedure, router } from "../../trpc";

export const participants = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .query(async ({ input: { pollId } }) => {
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
    }),
  delete: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        participantId: z.string(),
      }),
    )
    .mutation(async ({ input: { participantId } }) => {
      await prisma.participant.delete({
        where: {
          id: participantId,
        },
      });
    }),
  add: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        name: z.string().min(1, "Participant name is required"),
        email: z.string().optional(),
        votes: z
          .object({
            optionId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array(),
      }),
    )
    .mutation(async ({ ctx, input: { pollId, votes, name, email } }) => {
      const user = ctx.session.user;
      const res = await prisma.participant.create({
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
        select: {
          id: true,
          poll: {
            select: {
              title: true,
              participantUrlId: true,
            },
          },
        },
      });

      const { poll, ...participant } = res;

      if (email) {
        const token = await createToken(
          { userId: user.id },
          {
            ttl: 0, // basically forever
          },
        );

        await sendEmail("NewParticipantConfirmationEmail", {
          to: email,
          subject: `Your response for ${poll.title} has been received`,
          props: {
            name,
            title: poll.title,
            editSubmissionUrl: absoluteUrl(
              `/p/${poll.participantUrlId}?token=${token}`,
            ),
          },
        });
      }

      await sendNotification(pollId, {
        type: "newParticipant",
        participantName: name,
      });

      return participant;
    }),
  update: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        participantId: z.string(),
        votes: z
          .object({
            optionId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array(),
      }),
    )
    .mutation(async ({ input: { pollId, participantId, votes } }) => {
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
    }),
});
