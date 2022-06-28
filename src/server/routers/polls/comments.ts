import { z } from "zod";

import { prisma } from "~/prisma/db";

import { sendNotification } from "../../../utils/api-utils";
import { createRouter } from "../../createRouter";

export const comments = createRouter()
  .query("list", {
    input: z.object({
      pollId: z.string(),
    }),
    resolve: async ({ input: { pollId } }) => {
      return await prisma.comment.findMany({
        where: { pollId },
        orderBy: [
          {
            createdAt: "asc",
          },
        ],
      });
    },
  })
  .mutation("add", {
    input: z.object({
      pollId: z.string(),
      authorName: z.string(),
      content: z.string(),
    }),
    resolve: async ({ ctx, input: { pollId, authorName, content } }) => {
      const user = ctx.session.user;

      const newComment = await prisma.comment.create({
        data: {
          content,
          pollId,
          authorName,
          userId: user.id,
        },
      });

      await sendNotification(pollId, {
        type: "newComment",
        authorName: newComment.authorName,
      });

      return newComment;
    },
  })
  .mutation("delete", {
    input: z.object({
      pollId: z.string(),
      commentId: z.string(),
    }),
    resolve: async ({ input: { pollId, commentId } }) => {
      await prisma.comment.delete({
        where: {
          id_pollId: {
            id: commentId,
            pollId,
          },
        },
      });
    },
  });
