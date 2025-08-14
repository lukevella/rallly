import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";

import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";

const MAX_PARTICIPANTS = 1000;

async function sendNewParticipantNotifcationEmail({
  pollId,
  pollTitle,
  participantName,
}: {
  pollId: string;
  pollTitle: string;
  participantName: string;
}) {
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
          locale: true,
        },
      },
    },
  });

  await Promise.all(
    watchers.map(async (watcher) => {
      try {
        const email = watcher.user.email;
        const watcherLocale = watcher.user.locale ?? undefined;
        const token = await createToken<DisableNotificationsPayload>(
          { watcherId: watcher.id, pollId },
          { ttl: 0 },
        );
        await getEmailClient(watcherLocale).sendTemplate(
          "NewParticipantEmail",
          {
            to: email,
            props: {
              participantName,
              pollUrl: absoluteUrl(`/poll/${pollId}`),
              disableNotificationsUrl: absoluteUrl(
                `/api/notifications/unsubscribe?token=${token}`,
              ),
              title: pollTitle,
            },
          },
        );
      } catch (err) {
        Sentry.captureException(err);
      }
    }),
  );
}

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
    .use(requireUserMiddleware)
    .mutation(async ({ input: { participantId }, ctx }) => {
      const participant = await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });

      if (participant) {
        ctx.analytics.trackEvent({
          type: "poll_response_delete",
          userId: ctx.user.id,
          pollId: participant.pollId,
          properties: {
            participantId,
          },
        });
      }
    }),
  add: publicProcedure
    .use(createRateLimitMiddleware("add_participant", 5, "1 m"))
    .use(requireUserMiddleware)
    .input(
      z.object({
        pollId: z.string(),
        name: z.string().min(1, "Participant name is required").max(100),
        email: z.string().optional(),
        timeZone: z.string().optional(),
        votes: z
          .object({
            optionId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array(),
      }),
    )
    .mutation(
      async ({ ctx, input: { pollId, votes, name, email, timeZone } }) => {
        const { user } = ctx;

        const { participant, totalResponses } = await prisma.$transaction(
          async (prisma) => {
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
                timeZone,
                ...(user.isGuest ? { guestId: user.id } : { userId: user.id }),
                locale: user.locale ?? undefined,
              },
              include: {
                poll: {
                  select: {
                    id: true,
                    title: true,
                    userId: true,
                    guestId: true,
                  },
                },
              },
            });

            const options = await prisma.option.findMany({
              where: {
                pollId,
              },
              select: {
                id: true,
              },
            });

            const existingOptionIds = new Set(
              options.map((option) => option.id),
            );

            const validVotes = votes.filter(({ optionId }) =>
              existingOptionIds.has(optionId),
            );

            await prisma.vote.createMany({
              data: validVotes.map(({ optionId, type }) => ({
                optionId,
                type,
                pollId,
                participantId: participant.id,
              })),
            });

            return { participant, totalResponses: participantCount + 1 };
          },
        );

        if (email) {
          const token = await createToken(
            { userId: user.id },
            {
              ttl: 0, // basically forever
            },
          );

          getEmailClient(ctx.user.locale).queueTemplate(
            "NewParticipantConfirmationEmail",
            {
              to: email,
              props: {
                title: participant.poll.title,
                editSubmissionUrl: absoluteUrl(
                  `/invite/${participant.poll.id}?token=${token}`,
                ),
              },
            },
          );
        }

        waitUntil(
          sendNewParticipantNotifcationEmail({
            pollId,
            pollTitle: participant.poll.title,
            participantName: participant.name,
          }),
        );

        // Track participant addition analytics
        ctx.analytics.trackEvent({
          type: "poll_response_submit",
          userId: user.id,
          pollId,
          properties: {
            participantId: participant.id,
            hasEmail: !!email,
            totalResponses,
            isCreator: ctx.user.isGuest
              ? participant.poll.guestId === ctx.user.id
              : participant.poll.userId === ctx.user.id,
          },
        });

        return participant;
      },
    ),
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
    .use(requireUserMiddleware)
    .mutation(async ({ input: { pollId, participantId, votes }, ctx }) => {
      const participant = await prisma.$transaction(async (tx) => {
        // Delete existing votes
        await tx.vote.deleteMany({
          where: {
            participantId,
            pollId,
          },
        });

        const options = await prisma.option.findMany({
          where: {
            pollId,
          },
          select: {
            id: true,
          },
        });

        const existingOptionIds = new Set(options.map((option) => option.id));

        const validVotes = votes.filter(({ optionId }) =>
          existingOptionIds.has(optionId),
        );

        // Create new votes
        await tx.vote.createMany({
          data: validVotes.map(({ optionId, type }) => ({
            optionId,
            type,
            pollId,
            participantId,
          })),
        });

        // Return updated participant with votes
        return tx.participant.findUniqueOrThrow({
          where: {
            id: participantId,
          },
          include: {
            votes: true,
          },
        });
      });

      ctx.analytics.trackEvent({
        type: "poll_response_update",
        userId: ctx.user.id,
        pollId,
        properties: {
          participantId,
        },
      });

      return participant;
    }),
});
