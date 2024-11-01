import type { PollStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import * as ics from "ics";
import { z } from "zod";

import { posthog } from "@/app/posthog";
import { getEmailClient } from "@/utils/emails";

import { getTimeZoneAbbreviation } from "../../utils/date";
import { nanoid } from "../../utils/nanoid";
import {
  possiblyPublicProcedure,
  proProcedure,
  publicProcedure,
  rateLimitMiddleware,
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
  getCountByStatus: possiblyPublicProcedure.query(async ({ ctx }) => {
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
  infiniteList: possiblyPublicProcedure
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
          userId: ctx.user.id,
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
          userId: true,
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
        nextCursor = nextItem!.id;
      }
      return {
        polls,
        nextCursor,
      };
    }),

  // START LEGACY ROUTES
  create: possiblyPublicProcedure
    .use(rateLimitMiddleware)
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
        demo: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const adminToken = nanoid();
      const participantUrlId = nanoid();
      const pollId = nanoid();

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
          userId: ctx.user.id,
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
        closed: z.boolean().optional(),
        hideParticipants: z.boolean().optional(),
        disableComments: z.boolean().optional(),
        hideScores: z.boolean().optional(),
        requireParticipantEmail: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const pollId = await getPollIdFromAdminUrlId(input.urlId);

      if (input.optionsToDelete && input.optionsToDelete.length > 0) {
        await prisma.$transaction([
          prisma.option.deleteMany({
            where: {
              pollId,
              id: {
                in: input.optionsToDelete,
              },
            },
          }),
          prisma.vote.deleteMany({
            where: {
              optionId: {
                in: input.optionsToDelete,
              },
            },
          }),
        ]);
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
          closed: input.closed,
          hideScores: input.hideScores,
          hideParticipants: input.hideParticipants,
          disableComments: input.disableComments,
          requireParticipantEmail: input.requireParticipantEmail,
        },
      });
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
    }),
  touch: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input: { pollId } }) => {
      await prisma.poll.update({
        where: {
          id: pollId,
        },
        data: {
          touchedAt: new Date(),
        },
      });
    }),
  // END LEGACY ROUTES
  getWatchers: possiblyPublicProcedure
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
  watch: possiblyPublicProcedure
    .input(z.object({ pollId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.isGuest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Guests can't watch polls",
        });
      }

      await prisma.watcher.create({
        data: {
          pollId: input.pollId,
          userId: ctx.user.id,
        },
      });
    }),
  unwatch: possiblyPublicProcedure
    .input(z.object({ pollId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.isGuest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Guests can't unwatch polls",
        });
      }

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
  getByAdminUrlId: possiblyPublicProcedure
    .input(
      z.object({
        urlId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const res = await prisma.poll.findUnique({
        select: {
          id: true,
        },
        where: {
          adminUrlId: input.urlId,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }

      return res;
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
          closed: true,
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
          user: true,
          userId: true,
          deleted: true,
          event: {
            select: {
              start: true,
              duration: true,
              optionId: true,
            },
          },
          watchers: {
            select: {
              userId: true,
            },
          },
        },
        where: {
          id: input.urlId,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }
      const inviteLink = shortUrl(`/invite/${res.id}`);

      if (ctx.user.id === res.userId || res.adminUrlId === input.adminToken) {
        return { ...res, inviteLink };
      } else {
        return { ...res, adminUrlId: "", inviteLink };
      }
    }),
  transfer: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          userId: ctx.user.id,
        },
      });
    }),
  getParticipating: possiblyPublicProcedure
    .input(
      z.object({
        pagination: z.object({
          pageIndex: z.number(),
          pageSize: z.number(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [total, rows] = await Promise.all([
        prisma.poll.count({
          where: {
            participants: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        }),
        prisma.poll.findMany({
          where: {
            deletedAt: null,
            participants: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
          select: {
            id: true,
            title: true,
            location: true,
            createdAt: true,
            timeZone: true,
            adminUrlId: true,
            participantUrlId: true,
            status: true,
            event: {
              select: {
                start: true,
                duration: true,
              },
            },
            closed: true,
            participants: {
              select: {
                id: true,
                name: true,
              },
              orderBy: [
                {
                  createdAt: "desc",
                },
                { name: "desc" },
              ],
            },
          },
          orderBy: [
            {
              createdAt: "desc",
            },
            { title: "asc" },
          ],
          skip: input.pagination.pageIndex * input.pagination.pageSize,
          take: input.pagination.pageSize,
        }),
      ]);

      return { total, rows };
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
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          participants: {
            select: {
              name: true,
              email: true,
              locale: true,
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

      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          status: "finalized",
          event: {
            create: {
              optionId: input.optionId,
              start: eventStart.toDate(),
              duration: option.duration,
              title: poll.title,
              userId: ctx.user.id,
            },
          },
        },
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
        const timeZoneAbbrev = poll.timeZone
          ? getTimeZoneAbbreviation(eventStart.toDate(), poll.timeZone)
          : "";
        const date = eventStart.format("dddd, MMMM D, YYYY");
        const day = eventStart.format("D");
        const dow = eventStart.format("ddd");
        const startTime = eventStart.format("hh:mm A");
        const endTime = eventEnd.format("hh:mm A");

        const time =
          option.duration > 0
            ? `${startTime} - ${endTime} ${timeZoneAbbrev}`
            : "All-day";

        const participantsToEmail: Array<{
          name: string;
          email: string;
          locale: string | undefined;
        }> = [];

        if (input.notify === "all") {
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
      }
    }),
  reopen: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.$transaction([
        prisma.poll.update({
          where: {
            id: input.pollId,
          },
          data: {
            event: {
              delete: true,
            },
            status: "live",
            closed: false, // @deprecated
          },
        }),
      ]);
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
          closed: true, // TODO (Luke Vella) [2023-12-05]:  Remove this
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
          closed: false,
          status: "live",
        },
      });
    }),
});
