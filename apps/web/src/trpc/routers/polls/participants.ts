import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { waitUntil } from "@vercel/functions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasPollAdminAccess } from "@/features/poll/query";
import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";
import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";
import { createParticipantEditToken, resolveUserId } from "./utils";

const MAX_PARTICIPANTS = 1000;

async function canModifyParticipant(participantId: string, userId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, pollId: true, userId: true, guestId: true },
  });

  if (!participant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Participant not found",
    });
  }

  const isOwner =
    participant.userId === userId || participant.guestId === userId;

  if (!isOwner && !(await hasPollAdminAccess(participant.pollId, userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not allowed to modify this participant",
    });
  }

  return participant;
}

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
        const emailClient = await getEmailClient(watcherLocale);
        await emailClient.sendTemplate("NewParticipantEmail", {
          to: email,
          props: {
            participantName,
            pollUrl: absoluteUrl(`/poll/${pollId}`),
            disableNotificationsUrl: absoluteUrl(
              `/api/notifications/unsubscribe?token=${token}`,
            ),
            title: pollTitle,
          },
        });
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
    .query(async ({ ctx, input: { pollId } }) => {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: {
          hideParticipants: true,
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Poll not found" });
      }

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

      // Hide participants if the poll has hideParticipants enabled
      // and the current user is not an admin
      if (poll.hideParticipants) {
        const isAdmin =
          ctx.user && (await hasPollAdminAccess(pollId, ctx.user.id));
        if (!isAdmin) {
          return participants.map((participant) => {
            // If the current user is the participant, return the participant
            if (ctx.user && participant.userId === ctx.user.id) {
              return participant;
            }

            return {
              ...participant,
              name: "Anonymous",
              email: null,
            };
          });
        }
      }

      return participants;
    }),
  delete: publicProcedure
    .input(
      z.object({
        participantId: z.string(),
        token: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { participantId, token }, ctx }) => {
      const userId = await resolveUserId(token, ctx.user);

      const participant = await canModifyParticipant(participantId, userId);

      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });

      ctx.posthog?.capture({
        distinctId: userId,
        event: "poll_response_delete",
        properties: {
          participant_id: participant.id,
        },
        groups: {
          poll: participant.pollId,
        },
      });

      revalidatePath(`/invite/${participant.pollId}`);
    }),
  add: publicProcedure
    .use(createRateLimitMiddleware("add_participant", 5, "1 m"))
    .use(requireUserMiddleware)
    .input(
      z.object({
        pollId: z.string(),
        name: z.string().trim().min(1, "Participant name is required").max(100),
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

        const participant = await prisma.participant.create({
          data: {
            pollId: pollId,
            name: name,
            email,
            timeZone,
            ...(ctx.user.isLegacyGuest
              ? { guestId: ctx.user.id }
              : { userId: ctx.user.id }),
            locale: ctx.user.locale ?? undefined,
            votes: {
              createMany: {
                data: validVotes.map(({ optionId, type }) => ({
                  pollId,
                  optionId,
                  type,
                })),
              },
            },
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

        const totalResponses = participantCount + 1;

        if (email) {
          const token = await createParticipantEditToken(ctx.user.id);

          const emailClient = await getEmailClient(
            ctx.user.locale ?? undefined,
          );

          emailClient.queueTemplate("NewParticipantConfirmationEmail", {
            to: email,
            props: {
              title: participant.poll.title,
              editSubmissionUrl: absoluteUrl(
                `/invite/${participant.poll.id}?token=${token}`,
              ),
            },
          });
        }

        waitUntil(
          sendNewParticipantNotifcationEmail({
            pollId,
            pollTitle: participant.poll.title,
            participantName: participant.name,
          }),
        );

        ctx.posthog?.groupIdentify({
          groupType: "poll",
          groupKey: pollId,
          properties: {
            participant_count: totalResponses,
          },
        });

        // Track participant addition analytics
        ctx.posthog?.capture({
          distinctId: ctx.user.id,
          event: "poll_response_submit",
          properties: {
            participant_id: participant.id,
            participant_name: participant.name,
            has_email: !!email,
            total_responses: totalResponses,
          },
          groups: {
            poll: pollId,
          },
        });

        revalidatePath(`/invite/${pollId}`);

        return participant;
      },
    ),
  rename: publicProcedure
    .input(
      z.object({
        participantId: z.string(),
        newName: z.string().min(1, "Participant name is required").max(100),
        token: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { participantId, newName, token }, ctx }) => {
      const userId = await resolveUserId(token, ctx.user);

      const participant = await canModifyParticipant(participantId, userId);

      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          name: newName,
        },
        select: null,
      });

      revalidatePath(`/invite/${participant.pollId}`);
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
        token: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { participantId, votes, token }, ctx }) => {
      const userId = await resolveUserId(token, ctx.user);

      const existingParticipant = await canModifyParticipant(
        participantId,
        userId,
      );

      const pollId = existingParticipant.pollId;

      const participant = await prisma.$transaction(async (tx) => {
        // Delete existing votes
        await tx.vote.deleteMany({
          where: {
            participantId,
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

      ctx.posthog?.capture({
        distinctId: userId,
        event: "poll_response_update",
        groups: {
          poll: pollId,
        },
      });

      revalidatePath(`/invite/${pollId}`);

      return participant;
    }),
});
