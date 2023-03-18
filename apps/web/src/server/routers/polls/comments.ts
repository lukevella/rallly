import { prisma } from "@rallly/database";
import { z } from "zod";

import { sendNotification } from "../../../utils/api-utils";
import { publicProcedure, router } from "../../trpc";

export const comments = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .query(async ({ input: { pollId } }) => {
      return await prisma.comment.findMany({
        where: { pollId },
        orderBy: [
          {
            createdAt: "asc",
          },
        ],
      });
    }),
  add: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        authorName: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { pollId, authorName, content } }) => {
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
  delete: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
      }),
    )
    .mutation(async ({ input: { commentId } }) => {
      await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });
    }),
});
