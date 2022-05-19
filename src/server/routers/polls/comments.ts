import { z } from "zod";

import { prisma } from "~/prisma/db";

import { sendNotification } from "../../../utils/api-utils";
import { createGuestUser } from "../../../utils/auth";
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
      if (!ctx.session.user) {
        await createGuestUser(ctx.session);
      }

      const newComment = await prisma.comment.create({
        data: {
          content,
          pollId,
          authorName,
          userId: ctx.session.user?.isGuest ? undefined : ctx.session.user?.id,
          guestId: ctx.session.user?.isGuest ? ctx.session.user.id : undefined,
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
