import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { z } from "zod";

import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";

import { publicProcedure, rateLimitMiddleware, router } from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";

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
    .use(rateLimitMiddleware)
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
          ...(ctx.user.isGuest
            ? { guestId: ctx.user.id }
            : { userId: ctx.user.id }),
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

        getEmailClient(watcher.user.locale ?? undefined).queueTemplate(
          "NewCommentEmail",
          {
            to: email,
            props: {
              authorName,
              pollUrl: absoluteUrl(`/poll/${poll.id}`),
              disableNotificationsUrl: absoluteUrl(
                `/api/notifications/unsubscribe?token=${token}`,
              ),
              title: poll.title,
            },
          },
        );
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
