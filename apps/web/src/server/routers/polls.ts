import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createToken, EnableNotificationsTokenPayload } from "@/utils/auth";

import { absoluteUrl } from "../../utils/absolute-url";
import { nanoid } from "../../utils/nanoid";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { possiblyPublicProcedure, publicProcedure, router } from "../trpc";
import { comments } from "./polls/comments";
import { demo } from "./polls/demo";
import { participants } from "./polls/participants";

const defaultSelectFields: {
  id: true;
  timeZone: true;
  title: true;
  authorName: true;
  location: true;
  description: true;
  createdAt: true;
  adminUrlId: true;
  participantUrlId: true;
  verified: true;
  closed: true;
  legacy: true;
  demo: true;
  notifications: true;
  options: {
    orderBy: {
      value: "asc";
    };
  };
  user: true;
  deleted: true;
} = {
  id: true,
  timeZone: true,
  title: true,
  authorName: true,
  location: true,
  description: true,
  createdAt: true,
  adminUrlId: true,
  participantUrlId: true,
  verified: true,
  closed: true,
  legacy: true,
  notifications: true,
  demo: true,
  options: {
    orderBy: {
      value: "asc",
    },
  },
  user: true,
  deleted: true,
};

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
        type: z.literal("date"),
        timeZone: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        user: z.object({
          name: z.string(),
          email: z.string(),
        }),
        options: z.string().array(),
        demo: z.boolean().optional(),
      }),
    )
    .mutation(
      async ({ ctx, input }): Promise<{ id: string; urlId: string }> => {
        const adminUrlId = await nanoid();
        const participantUrlId = await nanoid();
        let verified = false;

        if (ctx.session.user.isGuest === false) {
          const user = await prisma.user.findUnique({
            where: { id: ctx.session.user.id },
          });

          // If user is logged in with the same email address
          if (user?.email === input.user.email) {
            verified = true;
          }
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
            type: input.type,
            timeZone: input.timeZone,
            location: input.location,
            description: input.description,
            authorName: input.user.name,
            demo: input.demo,
            verified: verified,
            notifications: verified,
            adminUrlId,
            participantUrlId,
            user: {
              connectOrCreate: {
                where: {
                  email: input.user.email,
                },
                create: {
                  id: await nanoid(),
                  ...input.user,
                },
              },
            },
            options: {
              createMany: {
                data: input.options.map((value) => ({
                  value,
                })),
              },
            },
          },
        });

        const adminLink = absoluteUrl(`/admin/${adminUrlId}`);
        const participantLink = absoluteUrl(`/p/${participantUrlId}`);

        await sendEmail("NewPollEmail", {
          to: input.user.email,
          subject: `Let's find a date for ${poll.title}`,
          props: {
            title: poll.title,
            name: input.user.name,
            adminLink,
            participantLink,
          },
        });

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
        notifications: z.boolean().optional(),
        closed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }): Promise<GetPollApiResponse> => {
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
          data: input.optionsToAdd.map((optionValue) => ({
            value: optionValue,
            pollId,
          })),
        });
      }

      const poll = await prisma.poll.update({
        select: defaultSelectFields,
        where: {
          id: pollId,
        },
        data: {
          title: input.title,
          location: input.location,
          description: input.description,
          timeZone: input.timeZone,
          notifications: input.notifications,
          closed: input.closed,
        },
      });

      return { ...poll };
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
  enableNotifications: possiblyPublicProcedure
    .input(z.object({ adminUrlId: z.string() }))
    .mutation(async ({ input }) => {
      const poll = await prisma.poll.findUnique({
        select: {
          id: true,
          title: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        where: {
          adminUrlId: input.adminUrlId,
        },
      });

      if (!poll) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const token = await createToken<EnableNotificationsTokenPayload>({
        adminUrlId: input.adminUrlId,
      });

      await sendEmail("EnableNotificationsEmail", {
        to: poll.user.email,
        subject: "Please verify your email address",
        props: {
          name: poll.user.name,
          title: poll.title,
          adminLink: absoluteUrl(`/admin/${input.adminUrlId}`),
          verificationLink: absoluteUrl(
            `/auth/enable-notifications?token=${token}`,
          ),
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
        select: defaultSelectFields,
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
        select: defaultSelectFields,
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

      if (ctx.user.id === res.user.id) {
        return res;
      } else {
        return { ...res, adminUrlId: "" };
      }
    }),
});
