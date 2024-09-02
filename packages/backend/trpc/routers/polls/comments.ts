import { prisma } from "@rallly/database";
import { z } from "zod";

import { createToken } from "../../../session";
import { publicProcedure, router } from "../../trpc";
import { DisableNotificationsPayload } from "../../types";

export const comments = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        hideParticipants: z.boolean().optional(),
      }),
    )
    .query(async ({ input: { pollId, hideParticipants }, ctx }) => {
      return await prisma.comment.findMany({
        where: { pollId, userId: hideParticipants ? ctx.user.id : undefined },
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
      const newComment = await prisma.comment.create({
        data: {
          content,
          pollId,
          authorName,
          userId: ctx.user.id,
        },
        select: {
          id: true,
          createdAt: true,
          authorName: true,
          content: true,
          poll: {
            select: {
              title: true,
              id: true,
            },
          },
        },
      });

      const watchers = await prisma.watcher.findMany({
        where: {
          pollId,
        },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              email: true,
              name: true,
              locale: true,
            },
          },
        },
      });

      const poll = newComment.poll;

      for (const watcher of watchers) {
        const email = watcher.user.email;
        const token = await createToken<DisableNotificationsPayload>(
          { watcherId: watcher.id, pollId },
          { ttl: 0 },
        );
        ctx
          .getEmailClient(watcher.user.locale ?? undefined)
          .queueTemplate("NewCommentEmail", {
            to: email,
            props: {
              authorName,
              pollUrl: ctx.absoluteUrl(`/poll/${poll.id}`),
              disableNotificationsUrl: ctx.absoluteUrl(
                `/auth/disable-notifications?token=${token}`,
              ),
              title: poll.title,
            },
          });
      }

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
