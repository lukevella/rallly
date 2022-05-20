import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "~/prisma/db";

import { absoluteUrl } from "../../utils/absolute-url";
import { sendEmailTemplate } from "../../utils/api-utils";
import { createToken } from "../../utils/auth";
import { nanoid } from "../../utils/nanoid";
import {
  createPollResponse,
  getDefaultPollInclude,
  getLink,
  getPollFromLink,
} from "../../utils/queries";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { createRouter } from "../createRouter";
import { comments } from "./polls/comments";
import { demo } from "./polls/demo";
import { participants } from "./polls/participants";
import { verification } from "./polls/verification";

export const polls = createRouter()
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
    resolve: async ({ ctx, input }) => {
      const adminUrlId = await nanoid();

      const poll = await prisma.poll.create({
        data: {
          urlId: await nanoid(),
          title: input.title,
          type: input.type,
          timeZone: input.timeZone,
          location: input.location,
          description: input.description,
          authorName: input.user.name,
          demo: input.demo,
          verified:
            ctx.session.user?.isGuest === false &&
            ctx.session.user.email === input.user.email,
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
          links: {
            createMany: {
              data: [
                {
                  urlId: adminUrlId,
                  role: "admin",
                },
                {
                  urlId: await nanoid(),
                  role: "participant",
                },
              ],
            },
          },
        },
      });

      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${adminUrlId}`;

      try {
        if (poll.verified) {
          await sendEmailTemplate({
            templateName: "new-poll-verified",
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
            pollId: poll.urlId,
          });
          const verifyEmailUrl = `${pollUrl}?code=${verificationCode}`;

          await sendEmailTemplate({
            templateName: "new-poll",
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

      return { urlId: adminUrlId, authorName: poll.authorName };
    },
  })
  .query("get", {
    input: z.object({
      urlId: z.string(),
    }),
    resolve: async ({ input }): Promise<GetPollApiResponse> => {
      const link = await getLink(input.urlId);
      return await getPollFromLink(link);
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
      const link = await getLink(input.urlId);

      if (link.role !== "admin") {
        throw new Error("Use admin link to update poll");
      }

      const { pollId } = link;

      if (input.optionsToDelete && input.optionsToDelete.length > 0) {
        await prisma.$transaction([
          prisma.vote.deleteMany({
            where: {
              optionId: {
                in: input.optionsToDelete,
              },
            },
          }),
          prisma.option.deleteMany({
            where: {
              pollId,
              id: {
                in: input.optionsToDelete,
              },
            },
          }),
        ]);
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
        where: {
          urlId: pollId,
        },
        data: {
          title: input.title,
          location: input.location,
          description: input.description,
          timeZone: input.timeZone,
          notifications: input.notifications,
          closed: input.closed,
        },
        include: getDefaultPollInclude(link.role === "admin"),
      });

      return createPollResponse(poll, link);
    },
  })
  .mutation("delete", {
    input: z.object({
      urlId: z.string(),
    }),
    resolve: async ({ input: { urlId } }) => {
      const link = await getLink(urlId);
      if (link.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tried to delete poll using participant url",
        });
      }

      await prisma.poll.delete({ where: { urlId: link.pollId } });
    },
  })
  .mutation("touch", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      await prisma.poll.update({
        where: {
          urlId: pollId,
        },
        data: {
          touchedAt: new Date(),
        },
      });
    },
  });
