import type { Participant, VoteType } from "@rallly/database";
import { prisma } from "@rallly/database";
import { sendNewParticipantEmail } from "@rallly/emails/templates/new-participant";
import { sendNewParticipantConfirmationEmail } from "@rallly/emails/templates/new-participant-confirmation";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import * as z from "zod";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { posthog } from "@/features/analytics/posthog";
import { getNotificationRecipient } from "@/features/notifications/queries";
import { hasPollAdminAccess } from "@/features/poll/query";
import { getGravatarUrl } from "@/lib/utils/gravatar";
import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import {
  createParticipantEditToken,
  resolveUserId,
  tryResolveUserId,
} from "./utils";

const logger = createLogger("participants");

const MAX_PARTICIPANTS = 1000;

function createParticipantFullDTO(
  participant: Participant & { user: { image: string | null } | null } & {
    votes: { optionId: string; type: VoteType }[];
  },
) {
  const { votes, user, ...rest } = participant;
  return {
    ...rest,
    image: user?.image ?? getGravatarUrl(rest.email),
    votes,
    hidden: false,
  };
}

async function canModifyParticipant(participantId: string, userId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, pollId: true, userId: true },
  });

  if (!participant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Participant not found",
    });
  }

  const isOwner = participant.userId === userId;

  if (!isOwner && !(await hasPollAdminAccess(participant.pollId, userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not allowed to modify this participant",
    });
  }

  return participant;
}

async function sendNewResponseNotificationEmail({
  pollId,
  pollTitle,
  participantName,
  excludeUserId,
}: {
  pollId: string;
  pollTitle: string;
  participantName: string;
  excludeUserId: string;
}) {
  try {
    const recipient = await getNotificationRecipient({
      pollId,
      type: "poll.response.submitted",
      excludeUserId,
    });

    if (!recipient) {
      return;
    }

    await sendNewParticipantEmail({
      to: recipient.email,
      locale: recipient.locale ?? undefined,
      branding: await getInstanceBranding(),
      props: {
        participantName,
        pollUrl: absoluteUrl(`/poll/${pollId}`),
        disableNotificationsUrl: absoluteUrl("/settings/notifications"),
        title: pollTitle,
      },
    });
  } catch (err) {
    logger.error(
      { error: err, pollId },
      "Failed to send new response notification email",
    );
  }
}

export const participants = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        token: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input: { pollId, token } }) => {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: {
          hideParticipants: true,
          deleted: true,
        },
      });

      // A deleted poll never exposes its participants.
      if (!poll || poll.deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Poll not found" });
      }

      const rawParticipants = await prisma.participant.findMany({
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
          user: {
            select: {
              image: true,
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

      const participants = rawParticipants.map(createParticipantFullDTO);

      // Hide participants if the poll has hideParticipants enabled
      // and the current user is not an admin
      if (poll.hideParticipants) {
        // Admin check is intentionally bound to ctx.user only — an edit
        // token must never unlock the admin view of other participants.
        const isAdmin =
          ctx.user && (await hasPollAdminAccess(pollId, ctx.user.id));
        if (!isAdmin) {
          // Fall back to the edit token so a guest can still see their own
          // response when opening the email link in a fresh browser.
          const viewerId = await tryResolveUserId(token, ctx.user);
          return participants.map((participant) => {
            if (viewerId && participant.userId === viewerId) {
              return participant;
            }

            return {
              ...participant,
              userId: null,
              name: "",
              email: null,
              image: null,
              hidden: true,
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

      posthog()?.capture({
        distinctId: userId,
        event: "poll_response_delete",
        properties: {
          participant_id: participant.id,
        },
        groups: {
          poll: participant.pollId,
        },
      });
    }),
  add: publicProcedure
    .use(createRateLimitMiddleware("add_participant", 10, "1 h"))
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
            userId: ctx.user.id,
            locale: ctx.locale,
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
            votes: {
              select: {
                optionId: true,
                type: true,
              },
            },
            user: {
              select: {
                image: true,
              },
            },
            poll: {
              select: {
                id: true,
                title: true,
                space: {
                  select: {
                    showBranding: true,
                    primaryColor: true,
                    image: true,
                  },
                },
              },
            },
          },
        });

        const totalResponses = participantCount + 1;

        if (email) {
          const token = await createParticipantEditToken(ctx.user.id);

          const space = participant.poll.space;

          after(async () =>
            sendNewParticipantConfirmationEmail({
              to: email,
              locale: ctx.locale,
              branding: space
                ? await getSpaceBranding(space)
                : await getInstanceBranding(),
              props: {
                title: participant.poll.title,
                editSubmissionUrl: absoluteUrl(
                  `/invite/${participant.poll.id}?token=${token}`,
                ),
              },
            }),
          );
        }

        after(() =>
          sendNewResponseNotificationEmail({
            pollId,
            pollTitle: participant.poll.title,
            participantName: participant.name,
            excludeUserId: ctx.user.id,
          }),
        );

        posthog()?.capture({
          distinctId: ctx.user.id,
          event: "poll_response_submit",
          properties: {
            participant_id: participant.id,
            has_email: !!email,
            total_responses: totalResponses,
          },
          groups: {
            poll: pollId,
          },
        });

        return createParticipantFullDTO(participant);
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

      await canModifyParticipant(participantId, userId);

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

        const options = await tx.option.findMany({
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

        // Bump `updatedAt` so it reflects this vote change; the poll cleanup
        // job uses it to detect recent activity. An empty `data: {}` update is
        // a no-op for `@updatedAt`, so set it explicitly.
        return tx.participant.update({
          where: {
            id: participantId,
          },
          data: { updatedAt: new Date() },
          include: {
            votes: {
              select: {
                optionId: true,
                type: true,
              },
            },
            user: {
              select: {
                image: true,
              },
            },
          },
        });
      });

      posthog()?.capture({
        distinctId: userId,
        event: "poll_response_update",
        groups: {
          poll: pollId,
        },
      });

      return createParticipantFullDTO(participant);
    }),
});
