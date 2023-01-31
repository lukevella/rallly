import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "~/prisma/db";
import newPollTemplate from "~/templates/new-poll";
import newVerfiedPollTemplate from "~/templates/new-poll-verified";

import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import { createToken } from "../../utils/auth";
import { nanoid } from "../../utils/nanoid";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { createRouter } from "../createRouter";
import { publicProcedure, router } from "../trpc";
import { comments } from "./polls/comments";
import { demo } from "./polls/demo";
import { participants } from "./polls/participants";
import { verification } from "./polls/verification";

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

export const legacyPolls = createRouter()
  .merge("demo.", demo)
  .merge("participants.", participants)
  .merge("comments.", comments)
  .merge("verification.", verification)
  .mutation("create", {
    input: z.object({
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
    resolve: async ({ ctx, input }): Promise<{ urlId: string }> => {
      const adminUrlId = await nanoid();

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
          adminUrlId,
          participantUrlId: await nanoid(),
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

      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${adminUrlId}`;

      try {
        if (poll.verified) {
          await sendEmailTemplate({
            templateString: newVerfiedPollTemplate,
            to: input.user.email,
            subject: `Rallly: ${poll.title}`,
            templateVars: {
              title: poll.title,
              name: input.user.name,
              pollUrl,
              homePageUrl,
              supportEmail: process.env.SUPPORT_EMAIL,
            },
          });
        } else {
          const verificationCode = await createToken({
            pollId: poll.id,
          });
          const verifyEmailUrl = `${pollUrl}?code=${verificationCode}`;

          await sendEmailTemplate({
            templateString: newPollTemplate,
            to: input.user.email,
            subject: `Rallly: ${poll.title} - Verify your email address`,
            templateVars: {
              title: poll.title,
              name: input.user.name,
              pollUrl,
              verifyEmailUrl,
              homePageUrl,
              supportEmail: process.env.SUPPORT_EMAIL,
            },
          });
        }
      } catch (e) {
        console.error(e);
      }

      return { urlId: adminUrlId };
    },
  })
  .mutation("update", {
    input: z.object({
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
    resolve: async ({ input }): Promise<GetPollApiResponse> => {
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
    },
  })
  .mutation("delete", {
    input: z.object({
      urlId: z.string(),
    }),
    resolve: async ({ input: { urlId } }) => {
      const pollId = await getPollIdFromAdminUrlId(urlId);
      await prisma.poll.delete({ where: { id: pollId } });
    },
  })
  .mutation("touch", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      await prisma.poll.update({
        where: {
          id: pollId,
        },
        data: {
          touchedAt: new Date(),
        },
      });
    },
  });

export const poll = router({
  getByAdminUrlId: publicProcedure
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
