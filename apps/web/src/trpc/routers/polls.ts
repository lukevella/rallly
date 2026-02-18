import type { PollStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { getCurrentUserSpace } from "@/auth/data";
import { moderateContent } from "@/features/moderation";
import { getPolls } from "@/features/poll/data";
import { canUserManagePoll } from "@/features/poll/helpers";
import { hasPollAdminAccess } from "@/features/poll/query";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
import { dayjs } from "@/lib/dayjs";
import { getEmailClient } from "@/utils/emails";
import { createIcsEvent } from "@/utils/ics";
import {
  createRateLimitMiddleware,
  possiblyPublicProcedure,
  privateProcedure,
  proProcedure,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../trpc";
import { comments } from "./polls/comments";
import { participants } from "./polls/participants";

const getPollIdFromAdminUrlId = async (urlId: string) => {
  const res = await prisma.poll.findUnique({
    select: {
      id: true,
    },
    where: { adminUrlId: urlId },
  });

  if (!res) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Poll not found",
    });
  }
  return res.id;
};

export const polls = router({
  participants,
  comments,
  infiniteChronological: privateProcedure
    .input(
      z.object({
        status: z.enum(["open", "closed", "scheduled", "canceled"]).optional(),
        search: z.string().optional(),
        member: z.string().optional(),
        cursor: z.number().optional().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ input }) => {
      const { cursor: page, limit: pageSize, status, search, member } = input;

      const result = await getPolls({
        status,
        q: search,
        member,
        page,
        pageSize,
      });

      let nextCursor: number | undefined;
      if (result.hasNextPage) {
        nextCursor = page + 1;
      }

      return {
        polls: result.polls,
        nextCursor,
        hasNextPage: result.hasNextPage,
        total: result.total,
      };
    }),
  getCountByStatus: privateProcedure.query(async ({ ctx }) => {
    const res = await prisma.poll.groupBy({
      by: ["status"],
      where: {
        userId: ctx.user.id,
        deletedAt: null,
      },
      _count: {
        status: true,
      },
    });

    return res.reduce(
      (acc, { status, _count }) => {
        acc[status] = _count.status;
        return acc;
      },
      {} as Record<PollStatus, number>,
    );
  }),
  /** @deprecated */
  infiniteList: privateProcedure
    .input(
      z.object({
        status: z.enum(["all", "open", "closed", "scheduled", "canceled"]),
        cursor: z.string().optional(),
        limit: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status } = input;
      const polls = await prisma.poll.findMany({
        where: {
          ...(ctx.user.isLegacyGuest
            ? { guestId: ctx.user.id }
            : { userId: ctx.user.id }),
          deletedAt: null,
          status: status === "all" ? undefined : status,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            title: "asc",
          },
        ],
        cursor: cursor ? { id: cursor } : undefined,
        take: limit + 1,
        select: {
          id: true,
          title: true,
          location: true,
          timeZone: true,
          createdAt: true,
          status: true,
          guestId: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          participants: {
            where: {
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (polls.length > input.limit) {
        const nextItem = polls.pop();
        nextCursor = nextItem?.id;
      }
      return {
        polls,
        nextCursor,
      };
    }),

  make: possiblyPublicProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
        timeZone: z.string().optional(),
        location: z.string().trim().optional(),
        description: z.string().trim().optional(),
        hideParticipants: z.boolean().optional(),
        hideScores: z.boolean().optional(),
        disableComments: z.boolean().optional(),
        requireParticipantEmail: z.boolean().optional(),
        options: z
          .object({
            startDate: z.string(),
            endDate: z.string().optional(),
          })
          .array(),
      }),
    )
    .use(requireUserMiddleware)
    .use(createRateLimitMiddleware("create_poll", 20, "1 h"))
    .mutation(async ({ ctx, input }) => {
      const moderation = await moderateContent({
        userId: ctx.user.id,
        content: {
          Title: input.title,
          Description: input.description || "",
          Location: input.location || "",
        },
      });

      if (moderation.verdict !== "safe") {
        ctx.posthog?.capture({
          distinctId: ctx.user.id,
          event: "flagged_content",
          properties: {
            action: "create_poll",
            verdict: moderation.verdict,
            reason: moderation.reason,
          },
        });
      }

      if (moderation.verdict === "flagged") {
        return {
          ok: false as const,
          error: { code: "INAPPROPRIATE_CONTENT" as const },
        };
      }

      const title = input.title;
      const location = input.location || undefined;
      const description = input.description || undefined;
      const adminToken = nanoid();
      const participantUrlId = nanoid();
      const pollId = nanoid();
      let spaceId: string | undefined;

      if (!ctx.user.isGuest) {
        const data = await getCurrentUserSpace();
        if (!data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Space not found",
          });
        }
        spaceId = data.space.id;
      }

      const poll = await prisma.poll.create({
        include: {
          options: {
            select: {
              id: true,
            },
          },
        },
        data: {
          id: pollId,
          title,
          timeZone: input.timeZone,
          location,
          description,
          adminUrlId: adminToken,
          participantUrlId,
          ...(ctx.user.isLegacyGuest
            ? { guestId: ctx.user.id }
            : { userId: ctx.user.id }),
          watchers: !ctx.user.isGuest
            ? {
                create: {
                  userId: ctx.user.id,
                },
              }
            : undefined,
          options: {
            createMany: {
              data: input.options.map((option) => ({
                startTime: input.timeZone
                  ? dayjs(option.startDate).tz(input.timeZone, true).toDate()
                  : dayjs(option.startDate).utc(true).toDate(),
                duration: option.endDate
                  ? dayjs(option.endDate).diff(
                      dayjs(option.startDate),
                      "minute",
                    )
                  : 0,
              })),
            },
          },
          hideParticipants: input.hideParticipants,
          disableComments: input.disableComments,
          hideScores: input.hideScores,
          requireParticipantEmail: input.requireParticipantEmail,
          spaceId,
        },
      });

      const pollLink = absoluteUrl(`/poll/${pollId}`);

      const participantLink = shortUrl(`/invite/${pollId}`);

      if (ctx.user.isGuest === false) {
        const user = await prisma.user.findUnique({
          select: { email: true, name: true },
          where: { id: ctx.user.id },
        });

        if (user) {
          const emailClient = await getEmailClient(
            ctx.user.locale ?? undefined,
          );
          emailClient.queueTemplate("NewPollEmail", {
            to: user.email,
            props: {
              title: poll.title,
              name: user.name,
              adminLink: pollLink,
              participantLink,
            },
          });
        }
      }

      ctx.posthog?.groupIdentify({
        groupType: "poll",
        groupKey: poll.id,
        properties: {
          name: poll.title,
          status: poll.status,
          is_guest: ctx.user.isGuest,
          created_at: poll.createdAt,
          participant_count: 0,
          comment_count: 0,
          option_count: poll.options.length,
          has_location: !!location,
          has_description: !!description,
          timezone: input.timeZone,
        },
      });

      ctx.posthog?.capture({
        event: "poll_create",
        distinctId: ctx.user.id,
        properties: {
          title: poll.title,
          optionCount: poll.options.length,
          hasLocation: !!location,
          hasDescription: !!description,
          timezone: input.timeZone,
          disableComments: poll.disableComments,
          hideParticipants: poll.hideParticipants,
          hideScores: poll.hideScores,
          requireParticipantEmail: poll.requireParticipantEmail,
          isGuest: ctx.user.isGuest,
        },
        groups: {
          poll: poll.id,
          ...(poll.spaceId ? { space: poll.spaceId } : {}),
        },
      });

      revalidatePath("/", "layout");

      return { ok: true as const, data: { id: poll.id } };
    }),
  modify: possiblyPublicProcedure
    .input(
      z.object({
        urlId: z.string(),
        title: z.string().trim().optional(),
        timeZone: z.string().optional(),
        location: z.string().trim().optional(),
        description: z.string().trim().optional(),
        optionsToDelete: z.string().array().optional(),
        optionsToAdd: z.string().array().optional(),
        hideParticipants: z.boolean().optional(),
        disableComments: z.boolean().optional(),
        hideScores: z.boolean().optional(),
        requireParticipantEmail: z.boolean().optional(),
      }),
    )
    .use(requireUserMiddleware)
    .use(createRateLimitMiddleware("update_poll", 10, "1 m"))
    .mutation(async ({ input, ctx }) => {
      const pollId = await getPollIdFromAdminUrlId(input.urlId);

      if (!(await hasPollAdminAccess(pollId, ctx.user.id))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this poll",
        });
      }

      const moderation = await moderateContent({
        userId: ctx.user.id,
        content: {
          Title: input.title || "",
          Description: input.description || "",
          Location: input.location || "",
        },
      });

      if (moderation.verdict !== "safe") {
        ctx.posthog?.capture({
          distinctId: ctx.user.id,
          event: "flagged_content",
          properties: {
            action: "update_poll",
            verdict: moderation.verdict,
            reason: moderation.reason,
          },
        });
      }

      if (moderation.verdict === "flagged") {
        return {
          ok: false as const,
          error: { code: "INAPPROPRIATE_CONTENT" as const },
        };
      }

      await prisma.$transaction(async (tx) => {
        if (input.optionsToDelete && input.optionsToDelete.length > 0) {
          await tx.option.deleteMany({
            where: {
              pollId,
              id: {
                in: input.optionsToDelete,
              },
            },
          });
        }

        if (input.optionsToAdd && input.optionsToAdd.length > 0) {
          await tx.option.createMany({
            data: input.optionsToAdd.map((optionValue) => {
              const [start, end] = optionValue.split("/");

              if (end) {
                return {
                  startTime: input.timeZone
                    ? dayjs(start).tz(input.timeZone, true).toDate()
                    : dayjs(start).utc(true).toDate(),
                  duration: dayjs(end).diff(dayjs(start), "minute"),
                  pollId,
                };
              } else {
                return {
                  startTime: dayjs(start).utc(true).toDate(),
                  pollId,
                };
              }
            }),
          });
        }
      });

      await prisma.poll.update({
        select: { id: true },
        where: {
          id: pollId,
        },
        data: {
          title: input.title,
          location: input.location,
          description: input.description,
          timeZone: input.timeZone,
          hideScores: input.hideScores,
          hideParticipants: input.hideParticipants,
          disableComments: input.disableComments,
          requireParticipantEmail: input.requireParticipantEmail,
        },
      });

      // Get updated poll data for group update
      const updatedPoll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: {
          title: true,
          status: true,
          createdAt: true,
          location: true,
          description: true,
          disableComments: true,
          requireParticipantEmail: true,
          hideParticipants: true,
          hideScores: true,
          timeZone: true,
          _count: {
            select: {
              participants: {
                where: { deleted: false },
              },
              comments: true,
              options: true,
            },
          },
        },
      });

      if (!updatedPoll) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      // Track specific poll update events based on what was changed
      const hasDetailsUpdate =
        input.title !== undefined ||
        input.location !== undefined ||
        input.description !== undefined;
      const hasOptionsUpdate =
        (input.optionsToDelete && input.optionsToDelete.length > 0) ||
        (input.optionsToAdd && input.optionsToAdd.length > 0);
      const hasSettingsUpdate =
        input.timeZone !== undefined ||
        input.hideParticipants !== undefined ||
        input.disableComments !== undefined ||
        input.hideScores !== undefined ||
        input.requireParticipantEmail !== undefined;

      if (hasDetailsUpdate) {
        ctx.posthog?.capture({
          event: "poll_update_details",
          distinctId: ctx.user.id,
          properties: {
            title: updatedPoll.title,
            has_location: !!updatedPoll.location,
            has_description: !!updatedPoll.description,
            is_guest: ctx.user.isGuest,
          },
          groups: {
            poll: pollId,
          },
        });
      }

      if (hasOptionsUpdate) {
        ctx.posthog?.capture({
          event: "poll_update_options",
          distinctId: ctx.user.id,
          properties: {
            option_count: updatedPoll._count.options,
          },
          groups: {
            poll: pollId,
          },
        });
      }

      if (hasSettingsUpdate) {
        ctx.posthog?.capture({
          event: "poll_update_settings",
          distinctId: ctx.user.id,
          properties: {
            disable_comments: !!updatedPoll.disableComments,
            hide_participants: !!updatedPoll.hideParticipants,
            hide_scores: !!updatedPoll.hideScores,
            require_participant_email: !!updatedPoll.requireParticipantEmail,
          },
          groups: {
            poll: pollId,
          },
        });
      }

      revalidatePath("/", "layout");

      return { ok: true as const };
    }),
  markAsDeleted: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input: { pollId }, ctx }) => {
      const hasAccess = await hasPollAdminAccess(pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to mark this poll as deleted",
        });
      }

      await prisma.poll.update({
        where: { id: pollId },
        data: { deleted: true, deletedAt: new Date() },
      });

      // Track poll deletion analytics
      ctx.posthog?.capture({
        event: "poll_delete",
        distinctId: ctx.user.id,
        groups: {
          poll: pollId,
        },
      });
    }),
  // END LEGACY ROUTES
  getWatchers: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .query(async ({ input: { pollId } }) => {
      return await prisma.watcher.findMany({
        where: {
          pollId,
        },
        select: {
          userId: true,
        },
      });
    }),
  watch: privateProcedure
    .input(z.object({ pollId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to watch this poll",
        });
      }

      await prisma.watcher.create({
        data: {
          pollId: input.pollId,
          userId: ctx.user.id,
        },
      });

      // Track poll watch analytics
      ctx.posthog?.capture({
        event: "poll_watch",
        distinctId: ctx.user.id,
        properties: {
          is_guest: ctx.user.isGuest,
        },
        groups: {
          poll: input.pollId,
        },
      });
    }),
  unwatch: privateProcedure
    .input(z.object({ pollId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const watcher = await prisma.watcher.findFirst({
        where: {
          pollId: input.pollId,
          userId: ctx.user.id,
        },
        select: {
          id: true,
        },
      });

      if (watcher) {
        await prisma.watcher.delete({
          where: {
            id: watcher.id,
          },
        });

        // Track poll unwatch analytics
        ctx.posthog?.capture({
          event: "poll_unwatch",
          distinctId: ctx.user.id,
          groups: {
            poll: input.pollId,
          },
        });
      }
    }),
  get: publicProcedure
    .input(
      z.object({
        urlId: z.string(),
        adminToken: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const res = await prisma.poll.findUnique({
        select: {
          id: true,
          timeZone: true,
          title: true,
          location: true,
          description: true,
          createdAt: true,
          adminUrlId: true,
          participantUrlId: true,
          status: true,
          hideParticipants: true,
          disableComments: true,
          hideScores: true,
          requireParticipantEmail: true,
          options: {
            select: {
              id: true,
              startTime: true,
              duration: true,
            },
            orderBy: {
              startTime: "asc",
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              banned: true,
            },
          },
          userId: true,
          guestId: true,
          deleted: true,
          spaceId: true,
          watchers: {
            select: {
              userId: true,
            },
          },
          scheduledEvent: {
            select: {
              id: true,
              start: true,
              end: true,
              allDay: true,
              status: true,
              invites: {
                select: {
                  id: true,
                  inviteeName: true,
                  inviteeEmail: true,
                  inviteeTimeZone: true,
                  status: true,
                },
              },
            },
          },
        },
        where: {
          id: input.urlId,
        },
      });

      if (!res) {
        return null;
      }
      const inviteLink = shortUrl(`/invite/${res.id}`);

      const canManagePoll = ctx.user
        ? await canUserManagePoll(ctx.user, res)
        : false;

      const event = res.scheduledEvent
        ? {
            id: res.scheduledEvent.id,
            start: res.scheduledEvent.start,
            duration: res.scheduledEvent.allDay
              ? 0
              : dayjs(res.scheduledEvent.end).diff(
                  dayjs(res.scheduledEvent.start),
                  "minute",
                ),
            attendees: res.scheduledEvent.invites
              .map((invite) => ({
                name: invite.inviteeName,
                email: invite.inviteeEmail,
                status: invite.status,
              }))
              .filter(
                (invite) =>
                  invite.status === "accepted" || invite.status === "tentative",
              ),
            status: res.scheduledEvent.status,
          }
        : null;

      if (canManagePoll || res.adminUrlId === input.adminToken) {
        return {
          ...res,
          inviteLink,
          event,
        };
      } else {
        return { ...res, adminUrlId: "", inviteLink, event };
      }
    }),
  book: proProcedure
    .input(
      z.object({
        pollId: z.string(),
        optionId: z.string(),
        notify: z.enum(["none", "all", "attendees"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to book a date for this poll",
        });
      }

      const poll = await prisma.poll.findUnique({
        where: {
          id: input.pollId,
        },
        select: {
          id: true,
          createdAt: true,
          timeZone: true,
          title: true,
          location: true,
          description: true,
          spaceId: true,
          user: {
            select: {
              name: true,
              email: true,
              locale: true,
            },
          },
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              locale: true,
              timeZone: true,
              user: {
                select: {
                  email: true,
                  timeZone: true,
                },
              },
              votes: {
                select: {
                  optionId: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!poll) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }

      if (!poll.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Poll has no user",
        });
      }

      // create event in database
      const option = await prisma.option.findUnique({
        where: {
          id: input.optionId,
        },
        select: {
          startTime: true,
          duration: true,
        },
      });

      if (!option) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Option not found",
        });
      }

      let eventStart = dayjs(option.startTime);

      if (poll.timeZone) {
        eventStart = eventStart.tz(poll.timeZone);
      } else {
        eventStart = eventStart.utc();
      }

      const { spaceId } = poll;

      if (!spaceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Poll has no space",
        });
      }

      const eventId = nanoid();
      const uid = `${eventId}@rallly.co`;

      const attendees = poll.participants.filter((p) =>
        p.votes.some((v) => v.optionId === input.optionId && v.type !== "no"),
      );

      const event = createIcsEvent({
        uid,
        sequence: 0,
        title: poll.title,
        location: poll.location ?? undefined,
        description: poll.description ?? undefined,
        start: option.startTime,
        end:
          option.duration > 0
            ? dayjs(option.startTime).add(option.duration, "minute").toDate()
            : dayjs(option.startTime).add(1, "day").toDate(),
        allDay: option.duration === 0,
        timeZone: poll.timeZone ?? undefined,
        organizer: {
          name: poll.user.name,
          email: poll.user.email,
        },
      });

      const scheduledEvent = await prisma.$transaction(async (tx) => {
        // create scheduled event
        const event = await tx.scheduledEvent.create({
          data: {
            id: eventId,
            uid: `${eventId}@rallly.co`,
            start: eventStart.toDate(),
            end:
              option.duration > 0
                ? eventStart.add(option.duration, "minute").toDate()
                : eventStart.add(1, "day").toDate(),
            title: poll.title,
            location: poll.location,
            timeZone: poll.timeZone,
            userId: ctx.user.id,
            spaceId,
            allDay: option.duration === 0,
            status: "confirmed",
            invites: {
              createMany: {
                data: poll.participants
                  .filter((p) => !!p.email)
                  .map((p) => ({
                    inviteeName: p.name,
                    inviteeEmail: p.email as string,
                    inviteeTimeZone:
                      p.user?.timeZone ?? p.timeZone ?? poll.timeZone,
                    status: (
                      {
                        yes: "accepted",
                        ifNeedBe: "tentative",
                        no: "declined",
                      } as const
                    )[
                      p.votes.find((v) => v.optionId === input.optionId)
                        ?.type ?? "no"
                    ],
                  })),
              },
            },
          },
        });
        // update poll status
        await tx.poll.update({
          where: {
            id: poll.id,
          },
          data: {
            status: "scheduled",
            scheduledEventId: event.id,
          },
        });

        return event;
      });

      if (event.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: event.error.message,
        });
      }

      if (!event.value) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate ics",
        });
      } else {
        const participantsToEmail: Array<{
          name: string;
          email: string;
          locale: string | undefined;
          timeZone: string | null;
        }> = [];

        if (input.notify === "all") {
          poll.participants.forEach((p) => {
            if (p.email) {
              participantsToEmail.push({
                name: p.name,
                email: p.email,
                locale: p.locale ?? undefined,
                timeZone: p.timeZone,
              });
            }
          });
        }

        if (input.notify === "attendees") {
          attendees.forEach((p) => {
            if (p.email) {
              participantsToEmail.push({
                name: p.name,
                email: p.email,
                locale: p.locale ?? undefined,
                timeZone: p.timeZone,
              });
            }
          });
        }

        const { date, day, dow, time } = formatEventDateTime({
          start: scheduledEvent.start,
          end: scheduledEvent.end,
          allDay: scheduledEvent.allDay,
          timeZone: scheduledEvent.timeZone,
        });

        const emailClient = await getEmailClient(poll.user.locale ?? undefined);
        emailClient.queueTemplate("FinalizeHostEmail", {
          to: poll.user.email,
          props: {
            name: poll.user.name,
            pollUrl: absoluteUrl(`/poll/${poll.id}`),
            location: poll.location,
            title: poll.title,
            attendees: poll.participants
              .filter((p) =>
                p.votes.some(
                  (v) => v.optionId === input.optionId && v.type !== "no",
                ),
              )
              .map((p) => p.name),
            date,
            day,
            dow,
            time,
          },
          icalEvent: {
            filename: "invite.ics",
            method: "request",
            content: event.value,
          },
        });

        for (const p of participantsToEmail) {
          const { date, day, dow, time } = formatEventDateTime({
            start: scheduledEvent.start,
            end: scheduledEvent.end,
            allDay: scheduledEvent.allDay,
            timeZone: scheduledEvent.timeZone,
            inviteeTimeZone: p.timeZone,
          });
          const emailClient = await getEmailClient(p.locale ?? undefined);
          emailClient.queueTemplate("FinalizeParticipantEmail", {
            to: p.email,
            props: {
              pollUrl: absoluteUrl(`/invite/${poll.id}`),
              title: poll.title,
              hostName: poll.user?.name ?? "",
              date,
              day,
              dow,
              time,
            },
            icalEvent: {
              filename: "invite.ics",
              method: "request",
              content: event.value,
            },
          });
        }

        ctx.posthog?.capture({
          event: "poll_schedule",
          distinctId: ctx.user.id,
          properties: {
            attendee_count: attendees.length,
            days_since_created: dayjs().diff(poll.createdAt, "day"),
            participant_count: poll.participants.length,
          },
          groups: {
            poll: poll.id,
          },
        });

        revalidatePath("/", "layout");
      }
    }),
  reopen: privateProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to reopen this poll",
        });
      }

      await prisma.$transaction(async () => {
        const poll = await prisma.poll.update({
          where: {
            id: input.pollId,
          },
          data: {
            status: "open",
          },
        });

        if (poll.scheduledEventId) {
          await prisma.scheduledEvent.delete({
            where: {
              id: poll.scheduledEventId,
            },
          });
        }
      });

      ctx.posthog?.capture({
        event: "poll_reopen",
        distinctId: ctx.user.id,
        groups: {
          poll: input.pollId,
        },
      });

      revalidatePath("/", "layout");
    }),
  close: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to close this poll",
        });
      }

      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "closed",
        },
      });

      ctx.posthog?.capture({
        event: "poll_close",
        distinctId: ctx.user.id,
        groups: {
          poll: input.pollId,
        },
      });

      revalidatePath("/", "layout");
    }),
  duplicate: proProcedure
    .input(
      z.object({
        pollId: z.string(),
        newTitle: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await hasPollAdminAccess(input.pollId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to duplicate this poll",
        });
      }

      const poll = await prisma.poll.findUnique({
        where: {
          id: input.pollId,
        },
        select: {
          location: true,
          description: true,
          timeZone: true,
          hideParticipants: true,
          hideScores: true,
          requireParticipantEmail: true,
          disableComments: true,
          spaceId: true,
          options: {
            select: {
              startTime: true,
              duration: true,
            },
          },
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Poll not found" });
      }

      const newPoll = await prisma.poll.create({
        select: {
          id: true,
        },
        data: {
          id: nanoid(),
          title: input.newTitle,
          userId: ctx.user.id,
          timeZone: poll.timeZone,
          location: poll.location,
          spaceId: poll.spaceId,
          requireParticipantEmail: poll.requireParticipantEmail,
          description: poll.description,
          hideParticipants: poll.hideParticipants,
          hideScores: poll.hideScores,
          disableComments: poll.disableComments,
          adminUrlId: nanoid(),
          participantUrlId: nanoid(),
          watchers: {
            create: {
              userId: ctx.user.id,
            },
          },
          options: {
            create: poll.options,
          },
        },
      });

      return newPoll;
    }),
});
