import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { z } from "zod";

import { trackPollEvent } from "@/features/poll/analytics";
import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";

import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";

export const comments = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        hideParticipants: z.boolean().optional(), // @deprecated
      }),
    )
    .query(async ({ input: { pollId }, ctx }) => {
      const poll = await prisma.poll.findUnique({
        where: {
          id: pollId,
        },
        select: {
          userId: true,
          guestId: true,
          hideParticipants: true,
        },
      });

      const isOwner = ctx.user?.isGuest
        ? poll?.guestId === ctx.user.id
        : poll?.userId === ctx.user?.id;

      const hideParticipants = poll?.hideParticipants && !isOwner;

      if (hideParticipants && !isOwner) {
        // if hideParticipants is enabled and the user is not the owner
        if (!ctx.user) {
          // cannot see any comments if there is no user
          return [];
        } else {
          // only show comments created by the current users
          return await prisma.comment.findMany({
            where: {
              pollId,
              ...(ctx.user.isGuest
                ? { guestId: ctx.user.id }
                : { userId: ctx.user.id }),
            },
            orderBy: [
              {
                createdAt: "asc",
              },
            ],
          });
        }
      }
      // return all comments
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
    .use(createRateLimitMiddleware("add_comment", 5, "1 m"))
    .use(requireUserMiddleware)
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

      // Track comment addition analytics
      trackPollEvent({
        type: "comment_added",
        userId: ctx.user.id,
        pollId,
        properties: {
          commentId: newComment.id,
          authorName,
          contentLength: content.length,
        },
      });

      return newComment;
    }),
  delete: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
      }),
    )
    .use(requireUserMiddleware)
    .mutation(async ({ input: { commentId }, ctx }) => {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { pollId: true },
      });

      await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });

      // Track comment deletion analytics
      if (comment) {
        trackPollEvent({
          type: "comment_deleted",
          userId: ctx.user.id,
          pollId: comment.pollId,
          properties: {
            commentId,
          },
        });
      }
    }),
});
