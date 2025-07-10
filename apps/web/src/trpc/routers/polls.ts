import type { PollStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import * as ics from "ics";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { moderateContent } from "@/features/moderation";
import { getEmailClient } from "@/utils/emails";

import { getActiveSpace } from "@/auth/queries";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
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

      let nextCursor: typeof cursor | undefined = undefined;
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
        const space = await getActiveSpace();
        spaceId = space.id;
      }

      const poll = await prisma.poll.create({
        select: {
          adminUrlId: true,
          id: true,
          title: true,
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
          ctx.user.getEmailClient().queueTemplate("NewPollEmail", {
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
    .use(createRateLimitMiddleware("update_poll", 5, "1 m"))
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
    .mutation(async ({ input }) => {
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
      revalidatePath("/", "layout");
    }),
  delete: possiblyPublicProcedure
    .input(
      z.object({
        urlId: z.string(),
      }),
    )
    .mutation(async ({ input: { urlId } }) => {
      const pollId = await getPollIdFromAdminUrlId(urlId);
      await prisma.poll.update({
        where: { id: pollId },
        data: { deleted: true, deletedAt: new Date() },
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

      const userId = ctx.user?.id;

      const isOwner = ctx.user?.isGuest
        ? userId === res.guestId
        : userId === res.userId;

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

      if (isOwner || res.adminUrlId === input.adminToken) {
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

      const scheduledEvent = await prisma.$transaction(async (tx) => {
        // create scheduled event
        const event = await tx.scheduledEvent.create({
          data: {
            start: eventStart.toDate(),
            end: eventStart.add(option.duration, "minute").toDate(),
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
                    inviteeTimeZone: p.user?.timeZone ?? poll.timeZone, // We should track participant's timezone
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

      const attendees = poll.participants.filter((p) =>
        p.votes.some((v) => v.optionId === input.optionId && v.type !== "no"),
      );

      const icsAttendees = attendees
        .filter((a) => !!a.email) // remove participants without email
        .map((a) => ({
          name: a.name,
          email: a.email ?? undefined,
        }));

      const utcStart = eventStart.utc();
      const eventEnd =
        option.duration > 0
          ? eventStart.add(option.duration, "minutes")
          : eventStart.add(1, "day");

      const event = ics.createEvent({
        uid: scheduledEvent.id,
        sequence: 0, // TODO: Get sequence from database
        title: poll.title,
        location: poll.location ?? undefined,
        description: poll.description ?? undefined,
        organizer: {
          name: poll.user.name,
          email: poll.user.email,
        },
        attendees: icsAttendees,
        ...(option.duration > 0
          ? {
              start: [
                utcStart.year(),
                utcStart.month() + 1,
                utcStart.date(),
                utcStart.hour(),
                utcStart.minute(),
              ],
              startInputType: poll.timeZone ? "utc" : "local",
              duration: { minutes: option.duration },
            }
          : {
              start: [
                eventStart.year(),
                eventStart.month() + 1,
                eventStart.date(),
              ],
              end: [eventEnd.year(), eventEnd.month() + 1, eventEnd.date()],
            }),
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
        }> = [];

        if (input.notify === "all") {
          // biome-ignore lint/complexity/noForEach: Fix this later
          poll.participants.forEach((p) => {
            if (p.email) {
              participantsToEmail.push({
                name: p.name,
                email: p.email,
                locale: p.locale ?? undefined,
              });
            }
          });
        }

        if (input.notify === "attendees") {
          // biome-ignore lint/complexity/noForEach: Fix this later
          attendees.forEach((p) => {
            if (p.email) {
              participantsToEmail.push({
                name: p.name,
                email: p.email,
                locale: p.locale ?? undefined,
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

        ctx.user.getEmailClient().queueTemplate("FinalizeHostEmail", {
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
          attachments: [{ filename: "event.ics", content: event.value }],
        });

        for (const p of participantsToEmail) {
          const { date, day, dow, time } = formatEventDateTime({
            start: scheduledEvent.start,
            end: scheduledEvent.end,
            allDay: scheduledEvent.allDay,
            timeZone: scheduledEvent.timeZone,
            // inviteeTimeZone: p.timeZone, // TODO: implement this
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

        posthog?.capture({
          distinctId: ctx.user.id,
          event: "finalize poll",
          properties: {
            poll_id: poll.id,
            poll_time_zone: poll.timeZone,
            number_of_participants: poll.participants.length,
            number_of_attendees: attendees.length,
            days_since_created: dayjs().diff(poll.createdAt, "day"),
          },
        });

        revalidatePath("/", "layout");
      }
    }),
  reopen: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
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
      revalidatePath("/", "layout");
    }),
  pause: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "paused",
        },
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
    .mutation(async ({ input }) => {
      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "live",
        },
      });
    }),
});
