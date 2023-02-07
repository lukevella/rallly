import { z } from "zod";

import { prisma } from "~/prisma/db";

import { sendNotification } from "../../../utils/api-utils";
import { createRouter } from "../../createRouter";

export const comments = t.router({
    list: t.procedure.input(z.object({
          pollId: z.string(),
        })).query(async ({ input: { pollId } }) => {
          return await prisma.comment.findMany({
            where: { pollId },
            orderBy: [
              {
                createdAt: "asc",
              },
            ],
          });
        }),
    add: t.procedure.input(z.object({
          pollId: z.string(),
          authorName: z.string(),
          content: z.string(),
        })).mutation(async ({ ctx, input: { pollId, authorName, content } }) => {
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
        }),
    delete: t.procedure.input(z.object({
          pollId: z.string(),
          commentId: z.string(),
        })).mutation(async ({ input: { pollId, commentId } }) => {
          await prisma.comment.delete({
            where: {
              id_pollId: {
                id: commentId,
                pollId,
              },
            },
          });
        }),
})
;
