import type { PollStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserSpace } from "@/auth/data";
import { moderateContent } from "@/features/moderation";
import { getPolls } from "@/features/poll/data";
import { canUserManagePoll } from "@/features/poll/helpers";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
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
        status: z.enum(["live", "paused", "finalized"]).optional(),
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
  infiniteList: privateProcedure
    .input(
      z.object({
        status: z.enum(["all", "live", "paused", "finalized"]),
        cursor: z.string().optional(),
        limit: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status } = input;
      const polls = await prisma.poll.findMany({
        where: {
          ...(ctx.user.isGuest
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

  // START LEGACY ROUTES
  create: possiblyPublicProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
        timeZone: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
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
    .use(async ({ ctx, input, next }) => {
      const isFlaggedContent = await moderateContent([
        input.title,
        input.description,
        input.location,
      ]);

      if (isFlaggedContent) {
        posthog?.capture({
          distinctId: ctx.user.id,
          event: "flagged_content",
          properties: {
            action: "create_poll",
          },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Inappropriate content",
        });
      }

      return next();
    })
    .mutation(async ({ ctx, input }) => {
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
          title: input.title,
          timeZone: input.timeZone,
          location: input.location,
          description: input.description,
          adminUrlId: adminToken,
          participantUrlId,
          ...(ctx.user.isGuest
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
          getEmailClient(ctx.user.locale).queueTemplate("NewPollEmail", {
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

      ctx.analytics.trackEvent({
        type: "poll_create",
        userId: ctx.user.id,
        pollId: poll.id,
        spaceId: poll.spaceId ?? undefined,
        properties: {
          title: poll.title,
          optionCount: poll.options.length,
          hasLocation: !!input.location,
          hasDescription: !!input.description,
          timezone: input.timeZone,
          disableCommnets: poll.disableComments,
          hideParticipants: poll.hideParticipants,
          hideScores: poll.hideScores,
          requireParticipantEmail: poll.requireParticipantEmail,
          isGuest: ctx.user.isGuest,
        },
      });

      revalidatePath("/", "layout");

      return { id: poll.id };
    }),
  update: possiblyPublicProcedure
    .input(
      z.object({
        urlId: z.string(),
        title: z.string().optional(),
        timeZone: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
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
    .use(async ({ ctx, input, next }) => {
      const isFlaggedContent = await moderateContent([
        input.title,
        input.description,
        input.location,
      ]);

      if (isFlaggedContent) {
        posthog?.capture({
          distinctId: ctx.user.id,
          event: "flagged_content",
          properties: {
            action: "update_poll",
          },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Inappropriate content",
        });
      }

      return next();
    })
    .mutation(async ({ input, ctx }) => {
      const pollId = await getPollIdFromAdminUrlId(input.urlId);

      if (input.optionsToDelete && input.optionsToDelete.length > 0) {
        await prisma.option.deleteMany({
          where: {
            pollId,
            id: {
              in: input.optionsToDelete,
            },
          },
        });
      }

      if (input.optionsToAdd && input.optionsToAdd.length > 0) {
        await prisma.option.createMany({
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
        ctx.analytics.trackEvent({
          type: "poll_update_details",
          userId: ctx.user.id,
          pollId,
          properties: {
            title: updatedPoll.title,
            hasLocation: !!updatedPoll.location,
            hasDescription: !!updatedPoll.description,
          },
        });
      }

      if (hasOptionsUpdate) {
        ctx.analytics.trackEvent({
          type: "poll_update_options",
          userId: ctx.user.id,
          pollId,
          properties: {
            optionCount: updatedPoll._count.options,
          },
        });
      }

      if (hasSettingsUpdate) {
        ctx.analytics.trackEvent({
          type: "poll_update_settings",
          userId: ctx.user.id,
          pollId,
          properties: {
            disableComments: !!updatedPoll.disableComments,
            hideParticipants: !!updatedPoll.hideParticipants,
            hideScores: !!updatedPoll.hideScores,
            requireParticipantEmail: !!updatedPoll.requireParticipantEmail,
          },
        });
      }

      revalidatePath("/", "layout");
    }),
  delete: possiblyPublicProcedure
    .input(
      z.object({
        urlId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input: { urlId }, ctx }) => {
      const pollId = await getPollIdFromAdminUrlId(urlId);
      await prisma.poll.update({
        where: { id: pollId },
        data: { deleted: true, deletedAt: new Date() },
      });

      // Track poll deletion analytics
      ctx.analytics.trackEvent({
        type: "poll_delete",
        userId: ctx.user.id,
        pollId,
      });

      revalidatePath("/", "layout");
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
      await prisma.watcher.create({
        data: {
          pollId: input.pollId,
          userId: ctx.user.id,
        },
      });

      // Track poll watch analytics
      ctx.analytics.trackEvent({
        type: "poll_watch",
        userId: ctx.user.id,
        pollId: input.pollId,
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
        ctx.analytics.trackEvent({
          type: "poll_unwatch",
          userId: ctx.user.id,
          pollId: input.pollId,
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
              email: true,
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

      const icsAttendees = attendees
        .filter((a) => !!a.email) // remove participants without email
        .map((a) => ({
          name: a.name,
          email: a.email as string,
        }));

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
        attendees: icsAttendees,
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
                  .filter((p) => p.email || p.user?.email) // Filter out participants without email
                  .map((p) => ({
                    inviteeName: p.name,
                    inviteeEmail:
                      p.user?.email ?? p.email ?? `${p.id}@rallly.co`,
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
            status: "finalized",
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

        getEmailClient(ctx.user.locale).queueTemplate("FinalizeHostEmail", {
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
          getEmailClient(p.locale ?? undefined).queueTemplate(
            "FinalizeParticipantEmail",
            {
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
              attachments: [{ filename: "event.ics", content: event.value }],
            },
          );
        }

        ctx.analytics.trackEvent({
          type: "poll_finalize",
          pollId: poll.id,
          userId: ctx.user.id,
          properties: {
            attendeeCount: attendees.length,
            daysSinceCreated: dayjs().diff(poll.createdAt, "day"),
            participantCount: poll.participants.length,
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
      await prisma.$transaction(async () => {
        const poll = await prisma.poll.update({
          where: {
            id: input.pollId,
          },
          data: {
            status: "live",
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

      ctx.analytics.trackEvent({
        type: "poll_reopen",
        pollId: input.pollId,
        userId: ctx.user.id,
      });

      revalidatePath("/", "layout");
    }),
  pause: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input, ctx }) => {
      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "paused",
        },
      });

      ctx.analytics.trackEvent({
        type: "poll_pause",
        pollId: input.pollId,
        userId: ctx.user.id,
      });
    }),
  duplicate: proProcedure
    .input(
      z.object({
        pollId: z.string(),
        newTitle: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
  resume: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input, ctx }) => {
      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "live",
        },
      });

      // Track poll resume analytics
      ctx.analytics.trackEvent({
        type: "poll_resume",
        userId: ctx.user.id,
        pollId: input.pollId,
      });
    }),
});
