import { prisma } from "@rallly/database";
import { sendEmail, sendRawEmail } from "@rallly/emails";
import { absoluteUrl } from "@rallly/utils";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";
import * as ics from "ics";
import { z } from "zod";

import { nanoid } from "../../utils/nanoid";
import { possiblyPublicProcedure, publicProcedure, router } from "../trpc";
import { comments } from "./polls/comments";
import { demo } from "./polls/demo";
import { options } from "./polls/options";
import { participants } from "./polls/participants";

dayjs.extend(toArray);
dayjs.extend(timezone);
dayjs.extend(utc);

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
  demo,
  participants,
  comments,
  options,
  // START LEGACY ROUTES
  create: possiblyPublicProcedure
    .input(
      z.object({
        title: z.string(),
        timeZone: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        user: z
          .object({
            name: z.string(),
            email: z.string(),
          })
          .optional(),
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
      let email: string;
      let name: string;
      if (input.user && ctx.user.isGuest) {
        email = input.user.email;
        name = input.user.name;
      } else {
        const user = await prisma.user.findUnique({
          select: { email: true, name: true },
          where: { id: ctx.user.id },
        });

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User not found",
          });
        }

        email = user.email;
        name = user.name;
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
          demo: input.demo,
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
                start: new Date(`${option.startDate}Z`),
                duration: option.endDate
                  ? dayjs(option.endDate).diff(
                      dayjs(option.startDate),
                      "minute",
                    )
                  : 0,
              })),
            },
          },
        },
      });

      await prisma.participant.create({
        data: {
          pollId,
          name,
          email,
          votes: {
            createMany: {
              data: poll.options.map(({ id }) => ({
                optionId: id,
                pollId,
                type: "yes",
              })),
            },
          },
        },
      });

      let pollLink = absoluteUrl(`/poll/${pollId}`);

      if (ctx.user.isGuest) {
        // Add admin token to link if creating as a guest
        pollLink += `?adminToken=${adminToken}`;
      }

      const participantLink = absoluteUrl(`/invite/${pollId}`);

      if (email && name) {
        await sendEmail("NewPollEmail", {
          to: email,
          subject: `Let's find a date for ${poll.title}`,
          props: {
            title: poll.title,
            name,
            adminLink: pollLink,
            participantLink,
          },
        });
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
      }),
    )
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
                start: new Date(`${start}Z`),
                duration: dayjs(end).diff(dayjs(start), "minute"),
                pollId,
              };
            } else {
              return {
                start: new Date(start.substring(0, 10) + "T00:00:00Z"),
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
      await prisma.poll.delete({ where: { id: pollId } });
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

      const res = await prisma.watcher.findFirst({
        where: {
          pollId: input.pollId,
          userId: ctx.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!res) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not watching this poll",
        });
      }

      await prisma.watcher.delete({
        where: {
          id: res.id,
        },
      });
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
          timeZone: true,
          title: true,
          location: true,
          description: true,
          createdAt: true,
          adminUrlId: true,
          participantUrlId: true,
          closed: true,
          legacy: true,
          demo: true,
          options: {
            orderBy: {
              start: "asc",
            },
          },
          user: true,
          deleted: true,
          watchers: {
            select: {
              userId: true,
            },
          },
        },
        where: {
          adminUrlId: input.urlId,
        },
        rejectOnNotFound: false,
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
          selectedOptionId: true,
          createdAt: true,
          adminUrlId: true,
          participantUrlId: true,
          closed: true,
          legacy: true,
          demo: true,
          options: {
            orderBy: {
              start: "asc",
            },
          },
          user: true,
          userId: true,
          deleted: true,
          watchers: {
            select: {
              userId: true,
            },
          },
        },
        where: {
          id: input.urlId,
        },
        rejectOnNotFound: false,
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }

      if (ctx.user.id === res.userId || res.adminUrlId === input.adminToken) {
        return res;
      } else {
        return { ...res, adminUrlId: "" };
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
  list: possiblyPublicProcedure.query(async ({ ctx }) => {
    const polls = await prisma.poll.findMany({
      where: {
        userId: ctx.user.id,
        deleted: false,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        adminUrlId: true,
        participantUrlId: true,
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
    });

    return polls;
  }),
  book: possiblyPublicProcedure
    .input(
      z.object({
        pollId: z.string(),
        optionId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const poll = await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          selectedOptionId: input.optionId,
        },
        select: {
          id: true,
          timeZone: true,
          title: true,
          user: {
            select: {
              email: true,
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
      });

      if (!option) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Option not found",
        });
      }
      let event: ics.ReturnObject;
      if (option.duration > 0) {
        // we need to remember to call .utc() on the dayjs() object
        // to make sure we get the correct time  because dayjs() will
        // use the local timezone
        const start = poll.timeZone
          ? dayjs(option.start).utc().tz(poll.timeZone, true).utc()
          : dayjs(option.start).utc();

        event = ics.createEvent({
          title: poll.title,
          start: [
            start.year(),
            start.month() + 1,
            start.date(),
            start.hour(),
            start.minute(),
          ],
          startInputType: poll.timeZone ? "utc" : "local",
          duration: { minutes: option.duration },
        });
      } else {
        const start = dayjs(option.start);
        const end = start.add(1, "day");
        event = ics.createEvent({
          title: poll.title,
          start: [start.year(), start.month() + 1, start.date()],
          end: [end.year(), end.month() + 1, end.date()],
        });
      }

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
        await sendRawEmail({
          subject: `Booking for ${poll.title}`,
          to: poll.user.email,
          html: `<p>Date booked for ${poll.title} <a href="${absoluteUrl(
            `/poll/${poll.id}`,
          )}">${poll.title}</a>.</p>`,
          attachments: [{ filename: "event.ics", content: event.value }],
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
      await prisma.poll.update({
        where: {
          id: input.pollId,
        },
        data: {
          selectedOptionId: null,
          closed: false,
        },
      });
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
          closed: true,
        },
      });
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
        },
      });
    }),
});
