import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createToken } from "../../../session";
import { publicProcedure, router } from "../../trpc";
import { DisableNotificationsPayload } from "../../types";

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
          votes: {
            select: {
              optionId: true,
              type: true,
            },
          },
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
      const { user } = ctx;

      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: {
          id: true,
          title: true,
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Poll not found" });
      }

      const participant = await prisma.participant.create({
        data: {
          pollId: pollId,
          name: name,
          email,
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
      });

      const emailsToSend: Promise<void>[] = [];
      if (email) {
        const token = await createToken(
          { userId: user.id },
          {
            ttl: 0, // basically forever
          },
        );

        emailsToSend.push(
          ctx.emailClient.sendTemplate("NewParticipantConfirmationEmail", {
            to: email,
            subject: `Thanks for responding to ${poll.title}`,
            props: {
              name,
              title: poll.title,
              editSubmissionUrl: absoluteUrl(
                `/invite/${poll.id}?token=${token}`,
              ),
            },
          }),
        );
      }

      const watchers = await prisma.watcher.findMany({
        where: {
          pollId,
        },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      for (const watcher of watchers) {
        const email = watcher.user.email;
        const token = await createToken<DisableNotificationsPayload>(
          { watcherId: watcher.id, pollId },
          { ttl: 0 },
        );
        emailsToSend.push(
          ctx.emailClient.sendTemplate("NewParticipantEmail", {
            to: email,
            subject: `${participant.name} has responded to ${poll.title}`,
            props: {
              name: watcher.user.name,
              participantName: participant.name,
              pollUrl: absoluteUrl(`/poll/${poll.id}`),
              disableNotificationsUrl: absoluteUrl(
                `/auth/disable-notifications?token=${token}`,
              ),
              title: poll.title,
            },
          }),
        );
      }

      await Promise.all(emailsToSend);

      return participant;
    }),
  rename: publicProcedure
    .input(z.object({ participantId: z.string(), newName: z.string() }))
    .mutation(async ({ input: { participantId, newName } }) => {
      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          name: newName,
        },
        select: null,
      });
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
