import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hasPollAdminAccess } from "@/features/poll/query";
import { getEmailClient } from "@/utils/emails";
import { createToken } from "@/utils/session";
import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import type { DisableNotificationsPayload } from "../../types";
import { resolveUserId } from "./utils";

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

      const isOwner = ctx.user?.isLegacyGuest
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
              ...(ctx.user.isLegacyGuest
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
    .use(createRateLimitMiddleware("add_comment", 10, "1 m"))
    .use(requireUserMiddleware)
    .input(
      z.object({
        pollId: z.string(),
        authorName: z.string().trim().min(1),
        content: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let authorName = input.authorName;

      if (!ctx.user.isGuest) {
        const user = await prisma.user.findUnique({
          where: {
            id: ctx.user.id,
          },
          select: {
            name: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User not found",
          });
        }

        authorName = user.name;
      }

      const { content, pollId } = input;

      const newComment = await prisma.comment.create({
        data: {
          content,
          pollId,
          authorName,
          ...(ctx.user.isLegacyGuest
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
      ctx.posthog?.capture({
        distinctId: ctx.user.id,
        event: "poll_comment_add",
        properties: {
          is_guest: ctx.user.isGuest,
        },
        groups: {
          poll: pollId,
        },
      });

      return newComment;
    }),
  delete: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        token: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { commentId, token }, ctx }) => {
      const userId = await resolveUserId(token, ctx.user);

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { pollId: true, userId: true, guestId: true },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      const isAuthor = comment.userId === userId || comment.guestId === userId;

      if (!isAuthor && !(await hasPollAdminAccess(comment.pollId, userId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to delete this comment",
        });
      }

      await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });

      // Track comment deletion analytics
      if (comment) {
        ctx.posthog?.capture({
          distinctId: userId,
          event: "poll_comment_delete",
          groups: {
            poll: comment.pollId,
          },
        });
      }
    }),
});
