import { z } from "zod";

import { prisma } from "../../db";
import {
  createPollResponse,
  getDefaultPollInclude,
  getLink,
  getPollFromLink,
} from "../../utils/queries";
import { GetPollApiResponse } from "../../utils/trpc/types";
import { createRouter } from "../createRouter";
import { demo } from "./polls/demo";

export const polls = createRouter()
  .merge("demo.", demo)
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
  });
