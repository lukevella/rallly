import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import { absoluteUrl } from "@rallly/utils";
import { z } from "zod";

import { createToken } from "../../../session";
import { publicProcedure, router } from "../../trpc";
import { DisableNotificationsPayload } from "../../types";

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
              adminUrlId: true,
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
            },
          },
        },
      });

      const poll = newComment.poll;

      const emailsToSend: Promise<void>[] = [];

      for (const watcher of watchers) {
        const email = watcher.user.email;
        const token = await createToken<DisableNotificationsPayload>(
          { watcherId: watcher.id, pollId },
          { ttl: 0 },
        );
        emailsToSend.push(
          sendEmail("NewCommentEmail", {
            to: email,
            subject: `New comment on ${poll.title}`,
            props: {
              name: watcher.user.name,
              authorName,
              pollUrl: absoluteUrl(`/admin/${poll.adminUrlId}`),
              disableNotificationsUrl: absoluteUrl(
                `/auth/disable-notifications?token=${token}`,
              ),
              title: poll.title,
            },
          }),
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
