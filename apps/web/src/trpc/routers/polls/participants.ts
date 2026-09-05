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
import { env } from "@/env";
import { getNotificationRecipient } from "@/features/notifications/data";
import { createUnsubscribeToken } from "@/features/notifications/utils";
import { recordPollActivities } from "@/features/poll/activity/mutations";
import {
  hasPollAdminAccess,
  listParticipantIdsByToken,
} from "@/features/poll/data";
import {
  attachParticipantToInvite,
  findPendingPollInvite,
} from "@/features/poll/invite/mutations";
import { generateAccessToken } from "@/features/poll/utils";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import { responseNoteInput } from "./schema";
import { authorizeParticipantEdit } from "./utils";

const logger = createLogger("participants");

const MAX_PARTICIPANTS = 1000;

function createParticipantFullDTO(
  participant: Participant & { user: { image: string | null } | null } & {
    votes: { optionId: string; type: VoteType }[];
  },
) {
  // The token is the edit credential: it never leaves the server.
  const { votes, user, token: _token, ...rest } = participant;
  return {
    ...rest,
    image: user?.image ?? null,
    votes,
    hidden: false,
  };
}

async function sendNewResponseNotificationEmail({
  pollId,
  pollTitle,
  participantName,
  participantEmail,
  note,
  excludeUserId,
}: {
  pollId: string;
  pollTitle: string;
  participantName: string;
  participantEmail: string | null;
  note: string | null;
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

    const unsubscribeToken = createUnsubscribeToken({
      target: { kind: "poll", pollId, userId: recipient.id },
      secret: env.SECRET_PASSWORD,
    });

    await sendNewParticipantEmail({
      to: recipient.email,
      locale: recipient.locale ?? undefined,
      branding: await getInstanceBranding(),
      replyTo: participantEmail ?? undefined,
      listUnsubscribeUrl: absoluteUrl(`/api/unsubscribe/${unsubscribeToken}`),
      props: {
        participantName,
        note: note ?? undefined,
        canReply: !!participantEmail,
        pollUrl: absoluteUrl(`/poll/${pollId}`),
        unsubscribeUrl: absoluteUrl(`/unsubscribe/${unsubscribeToken}`),
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

      // Admin check is intentionally bound to ctx.user only — an edit
      // token must never unlock the admin view of other participants.
      const isAdmin = ctx.user
        ? await hasPollAdminAccess(pollId, ctx.user.id)
        : false;

      // The emailed link names the viewer's own response, so a guest still
      // sees it as theirs when opening the link in a fresh browser.
      const linkedIds = new Set(
        token && !isAdmin
          ? await listParticipantIdsByToken({ pollId, token })
          : [],
      );
      const isOwn = (participant: { id: string; userId: string | null }) =>
        linkedIds.has(participant.id) ||
        (!!ctx.user && participant.userId === ctx.user.id);

      // Response notes are visible to the host and their author only: strip
      // them from every other payload rather than hiding them in the UI.
      const participants = rawParticipants.map((participant) => {
        const dto = createParticipantFullDTO(participant);
        if (isAdmin || isOwn(participant)) {
          return dto;
        }
        return { ...dto, note: null };
      });

      // Hide participants if the poll has hideParticipants enabled
      // and the current user is not an admin
      if (poll.hideParticipants) {
        if (!isAdmin) {
          return participants.map((participant) => {
            if (isOwn(participant)) {
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
      const { participant, actor } = await authorizeParticipantEdit({
        participantId,
        token,
        ctxUser: ctx.user,
      });

      await prisma.$transaction(async (tx) => {
        // Snapshot before the delete: the activity payload is the historical
        // record of the removed response, so it carries the name and votes.
        const snapshot = await tx.participant.findUniqueOrThrow({
          where: { id: participantId },
          select: {
            name: true,
            votes: {
              select: {
                optionId: true,
                type: true,
                option: {
                  select: { startTime: true, duration: true },
                },
              },
            },
          },
        });

        await tx.participant.update({
          where: {
            id: participantId,
          },
          data: {
            deleted: true,
            deletedAt: new Date(),
          },
        });

        await recordPollActivities(tx, [
          {
            pollId: participant.pollId,
            type: "response_deleted",
            userId: actor?.id,
            participantId,
            payload: {
              name: snapshot.name,
              votes: snapshot.votes.map((vote) => ({
                optionId: vote.optionId,
                start: vote.option.startTime.toISOString(),
                duration: vote.option.duration,
                type: vote.type,
              })),
            },
          },
        ]);
      });

      if (actor) {
        track(actor, {
          event: "poll_response_delete",
          properties: {
            participant_id: participant.id,
          },
          groups: {
            poll: participant.pollId,
          },
        });
      }
    }),
  add: publicProcedure
    .use(createRateLimitMiddleware("add_participant", 10, "1 h"))
    .use(requireUserMiddleware)
    .input(
      z.object({
        pollId: z.string(),
        name: z.string().trim().min(1, "Participant name is required").max(100),
        email: z.string().optional(),
        note: responseNoteInput,
        timeZone: z.string().optional(),
        token: z.string().optional(),
        votes: z
          .object({
            optionId: z.string(),
            type: z.enum(["yes", "no", "ifNeedBe"]),
          })
          .array(),
      }),
    )
    .mutation(
      async ({
        ctx,
        input: { pollId, votes, name, email, note, timeZone, token },
      }) => {
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
            cause: new AppError({
              code: "POLL_FULL",
              message: "Poll has reached the maximum number of participants",
            }),
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

        const { participant, editToken, viaInvite } = await prisma.$transaction(
          async (tx) => {
            // A response answering an emailed invite takes the invite's
            // token, so the link the invitee already holds names it.
            const invite = token
              ? await findPendingPollInvite(tx, { pollId, token })
              : null;
            const editToken = invite?.token ?? generateAccessToken();

            const participant = await tx.participant.create({
              data: {
                pollId: pollId,
                name: name,
                email,
                note,
                timeZone,
                token: editToken,
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
                        id: true,
                        tier: true,
                        showBranding: true,
                        hideAttribution: true,
                        primaryColor: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            });

            await recordPollActivities(tx, [
              {
                pollId,
                type: "response_created",
                userId: ctx.user.id,
                participantId: participant.id,
                payload: { name: participant.name },
              },
            ]);

            if (invite) {
              await attachParticipantToInvite(tx, {
                inviteId: invite.id,
                participantId: participant.id,
              });
            }

            return { participant, editToken, viaInvite: invite !== null };
          },
        );

        const totalResponses = participantCount + 1;

        if (email) {
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
                  `/invite/${participant.poll.id}?token=${editToken}`,
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
            participantEmail: participant.email,
            note: participant.note,
            excludeUserId: ctx.user.id,
          }),
        );

        track(ctx.user, {
          event: "poll_response_submit",
          properties: {
            participant_id: participant.id,
            // plain properties, not groups: guest events are personless and
            // PostHog drops group associations without person processing
            poll_id: pollId,
            space_id: participant.poll.space?.id,
            tier: participant.poll.space?.tier,
            has_email: !!email,
            via_invite: viaInvite,
            has_note: !!participant.note,
            note_length: participant.note?.length,
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
      const { participant, actor } = await authorizeParticipantEdit({
        participantId,
        token,
        ctxUser: ctx.user,
      });

      await prisma.$transaction(async (tx) => {
        await tx.participant.update({
          where: {
            id: participantId,
          },
          data: {
            name: newName,
          },
          select: null,
        });

        await recordPollActivities(tx, [
          {
            pollId: participant.pollId,
            type: "response_updated",
            userId: actor?.id,
            participantId,
            payload: { name: newName },
          },
        ]);
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
      const { participant: existingParticipant, actor } =
        await authorizeParticipantEdit({
          participantId,
          token,
          ctxUser: ctx.user,
        });

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
        const updatedParticipant = await tx.participant.update({
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

        await recordPollActivities(tx, [
          {
            pollId,
            type: "response_updated",
            userId: actor?.id,
            participantId,
            payload: { name: updatedParticipant.name },
          },
        ]);

        return updatedParticipant;
      });

      if (actor) {
        track(actor, {
          event: "poll_response_update",
          groups: {
            poll: pollId,
          },
        });
      }

      return createParticipantFullDTO(participant);
    }),
});
