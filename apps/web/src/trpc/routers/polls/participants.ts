import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createToken } from "@/utils/session";

import { publicProcedure, rateLimitMiddleware, router } from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";

const MAX_PARTICIPANTS = 1000;

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
          deleted: false,
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
      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });
    }),
  add: publicProcedure
    .use(rateLimitMiddleware)
    .input(
      z.object({
        pollId: z.string(),
        name: z.string().min(1, "Participant name is required").max(100),
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

      const participant = await prisma.$transaction(async (prisma) => {
        const participantCount = await prisma.participant.count({
          where: {
            pollId,
            deleted: false,
          },
        });

        if (participantCount >= MAX_PARTICIPANTS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `This poll has reached its maximum limit of ${MAX_PARTICIPANTS} participants`,
          });
        }

        const participant = await prisma.participant.create({
          data: {
            pollId: pollId,
            name: name,
            email,
            userId: user.id,
            locale: user.locale ?? undefined,
          },
          include: {
            poll: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        await prisma.vote.createMany({
          data: votes.map(({ optionId, type }) => ({
            optionId,
            type,
            pollId,
            participantId: participant.id,
          })),
        });

        return participant;
      });

      if (email) {
        const token = await createToken(
          { userId: user.id },
          {
            ttl: 0, // basically forever
          },
        );

        ctx.user
          .getEmailClient()
          .queueTemplate("NewParticipantConfirmationEmail", {
            to: email,
            props: {
              title: participant.poll.title,
              editSubmissionUrl: absoluteUrl(
                `/invite/${participant.poll.id}?token=${token}`,
              ),
            },
          });
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
        ctx.user.getEmailClient().queueTemplate("NewParticipantEmail", {
          to: email,
          props: {
            participantName: participant.name,
            pollUrl: absoluteUrl(`/poll/${participant.poll.id}`),
            disableNotificationsUrl: absoluteUrl(
              `/auth/disable-notifications?token=${token}`,
            ),
            title: participant.poll.title,
          },
        });
      }

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
