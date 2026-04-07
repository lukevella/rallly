import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import * as z from "zod";
import { posthog } from "@/features/analytics/posthog";
import { getNotificationRecipient } from "@/features/notifications/queries";
import { hasPollAdminAccess } from "@/features/poll/query";
import { getEmailClient } from "@/utils/emails";
import {
  createRateLimitMiddleware,
  publicProcedure,
  requireUserMiddleware,
  router,
} from "../../trpc";
import { resolveUserId } from "./utils";

const logger = createLogger("comments");

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
          hideParticipants: true,
        },
      });

      const isOwner = poll?.userId === ctx.user?.id;

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
              userId: ctx.user.id,
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

      const poll = newComment.poll;

      try {
        const recipient = await getNotificationRecipient({
          pollId,
          type: "poll.comment.added",
          excludeUserId: ctx.user.id,
        });

        if (recipient) {
          const emailClient = await getEmailClient({
            locale: recipient.locale ?? undefined,
          });
          after(() =>
            emailClient.sendTemplate("NewCommentEmail", {
              to: recipient.email,
              props: {
                authorName,
                pollUrl: absoluteUrl(`/poll/${poll.id}`),
                disableNotificationsUrl: absoluteUrl("/settings/notifications"),
                title: poll.title,
              },
            }),
          );
        }
      } catch (err) {
        logger.error(
          { error: err, pollId },
          "Failed to send new comment notification email",
        );
      }

      // Track comment addition analytics
      posthog()?.capture({
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
        select: { pollId: true, userId: true },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      const isAuthor = comment.userId === userId;

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
        posthog()?.capture({
          distinctId: userId,
          event: "poll_comment_delete",
          groups: {
            poll: comment.pollId,
          },
        });
      }
    }),
});
