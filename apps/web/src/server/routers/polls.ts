import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { z } from "zod";

import { absoluteUrl } from "../../utils/absolute-url";
import { nanoid } from "../../utils/nanoid";
import { possiblyPublicProcedure, publicProcedure, router } from "../trpc";
import { comments } from "./polls/comments";
import { demo } from "./polls/demo";
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
    });
  }
  return res.id;
};

export const polls = router({
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
    .mutation(
      async ({ ctx, input }): Promise<{ id: string; urlId: string }> => {
        const adminUrlId = await nanoid();
        const participantUrlId = await nanoid();

        let email = input.user?.email;
        let name = input.user?.name;

        if (!ctx.user.isGuest) {
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
          },
          data: {
            id: await nanoid(),
            title: input.title,
            timeZone: input.timeZone,
            location: input.location,
            description: input.description,
            demo: input.demo,
            adminUrlId,
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
                  start: new Date(option.startDate),
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

        const adminLink = absoluteUrl(`/admin/${adminUrlId}`);
        const participantLink = absoluteUrl(`/p/${participantUrlId}`);

        if (email && name) {
          await sendEmail("NewPollEmail", {
            to: email,
            subject: `Let's find a date for ${poll.title}`,
            props: {
              title: poll.title,
              name,
              adminLink,
              participantLink,
            },
          });
        }

        return { id: poll.id, urlId: adminUrlId };
      },
    ),
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
                start: new Date(start),
                duration: dayjs(end).diff(dayjs(start), "minute"),
                pollId,
              };
            } else {
              return {
                start: new Date(start.substring(0, 10) + "T00:00:00"),
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
  demo,
  participants,
  comments,
  // END LEGACY ROUTES
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
  getByParticipantUrlId: publicProcedure
    .input(
      z.object({
        urlId: z.string(),
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
          participantUrlId: input.urlId,
        },
        rejectOnNotFound: false,
      });

      if (!res) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Poll not found",
        });
      }

      if (ctx.user.id === res.userId) {
        return res;
      } else {
        return { ...res, adminUrlId: "" };
      }
    }),
});
