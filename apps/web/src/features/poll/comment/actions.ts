"use server";

import { sendNewCommentEmail } from "@rallly/emails/templates/new-comment";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { after } from "next/server";
import { getInstanceBranding } from "@/emails/branding";
import { env } from "@/env";
import { getNotificationRecipient } from "@/features/notifications/data";
import { createUnsubscribeToken } from "@/features/notifications/utils";
import { getComment } from "@/features/poll/comment/data";
import { addComment, deleteComment } from "@/features/poll/comment/mutations";
import {
  addCommentSchema,
  deleteCommentSchema,
} from "@/features/poll/comment/schema";
import { hasPollAdminAccess } from "@/features/poll/data";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  anyUserActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";

const logger = createLogger("comments");

async function sendNewCommentNotificationEmail({
  pollId,
  pollTitle,
  authorName,
  content,
  excludeUserId,
}: {
  pollId: string;
  pollTitle: string;
  authorName: string;
  content: string;
  excludeUserId: string;
}) {
  try {
    const recipient = await getNotificationRecipient({
      pollId,
      type: "poll.comment.added",
      excludeUserId,
    });

    if (!recipient) {
      return;
    }

    const unsubscribeToken = createUnsubscribeToken({
      target: { kind: "poll", pollId, userId: recipient.id },
      secret: env.SECRET_PASSWORD,
    });

    await sendNewCommentEmail({
      to: recipient.email,
      locale: recipient.locale ?? undefined,
      branding: await getInstanceBranding(),
      listUnsubscribeUrl: absoluteUrl(`/api/unsubscribe/${unsubscribeToken}`),
      props: {
        authorName,
        content,
        pollUrl: absoluteUrl(`/poll/${pollId}`),
        unsubscribeUrl: absoluteUrl(`/unsubscribe/${unsubscribeToken}`),
        disableNotificationsUrl: absoluteUrl("/settings/notifications"),
        title: pollTitle,
      },
    });
  } catch (err) {
    logger.error(
      { error: err, pollId },
      "Failed to send new comment notification email",
    );
  }
}

export const addCommentAction = anyUserActionClient
  .metadata({ actionName: "add_comment" })
  .use(createRateLimitMiddleware(10, "1 m"))
  .inputSchema(addCommentSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, authorName, content } = parsedInput;

    const result = await addComment({
      pollId,
      userId: ctx.user.id,
      isGuest: ctx.user.isGuest,
      authorName,
      content,
    });

    if (!result.ok) {
      return result;
    }

    const { comment } = result;

    after(() =>
      sendNewCommentNotificationEmail({
        pollId,
        pollTitle: comment.poll.title,
        authorName: comment.authorName,
        content: comment.content,
        excludeUserId: ctx.user.id,
      }),
    );

    track(ctx.user, {
      event: "poll_comment_add",
      properties: { is_guest: ctx.user.isGuest },
      groups: { poll: pollId },
    });

    return { ok: true as const, comment: { id: comment.id } };
  });

export const deleteCommentAction = anyUserActionClient
  .metadata({ actionName: "delete_comment" })
  .inputSchema(deleteCommentSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { commentId } = parsedInput;

    const comment = await getComment({ commentId });

    if (!comment) {
      throw new AppError({ code: "NOT_FOUND", message: "Comment not found" });
    }

    const isAuthor = comment.userId === ctx.user.id;

    if (!isAuthor && !(await hasPollAdminAccess(comment.pollId, ctx.user.id))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not allowed to delete this comment",
      });
    }

    await deleteComment({ commentId });

    track(ctx.user, {
      event: "poll_comment_delete",
      groups: { poll: comment.pollId },
    });

    return { ok: true as const };
  });
