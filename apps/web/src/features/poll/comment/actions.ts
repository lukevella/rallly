"use server";

import { timingSafeEqual } from "node:crypto";
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
import { generateAccessToken } from "@/features/poll/utils";
import { AppError } from "@/lib/errors/app-error";
import { getPollToken, setPollToken } from "@/lib/poll-token/server";
import { flushPostHog, track, trackSystemEvent } from "@/lib/posthog";
import {
  createRateLimitMiddleware,
  optionalUserActionClient,
} from "@/lib/safe-action/server";

const logger = createLogger("comments");

type Actor = { id: string; isGuest: boolean };

/**
 * How the commenter is known, for analytics. `is_guest` alone cannot tell a
 * guest session from a visitor with no session at all.
 */
function sessionAuthMethod(user: Actor | null) {
  if (!user) return "token" as const;
  return user.isGuest ? ("guest_session" as const) : ("account" as const);
}

function tokensMatch(held: string | null, stored: string | null) {
  if (!held || !stored || held.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(held), Buffer.from(stored));
}

/**
 * Comments by a visitor with no session have no person to attribute them
 * to, so they are captured personless with the poll as a plain property.
 */
function trackCommentEvent(
  user: Actor | null,
  event: string,
  pollId: string,
  properties: Record<string, unknown>,
) {
  const withPoll = { ...properties, poll_id: pollId };
  if (user) {
    track(user, { event, properties: withPoll, groups: { poll: pollId } });
  } else {
    trackSystemEvent({ event, properties: withPoll });
  }
}

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
  excludeUserId: string | null;
}) {
  try {
    const result = await getNotificationRecipient({
      pollId,
      type: "poll.comment.added",
      excludeUserId,
    });

    if (!result.ok) {
      logger.info(
        { pollId, reason: result.reason },
        "Skipped new comment notification email",
      );
      trackSystemEvent({
        event: "poll_notification:email_skip",
        properties: {
          poll_id: pollId,
          type: "poll.comment.added",
          reason: result.reason,
        },
      });
      await flushPostHog();
      return;
    }

    const { recipient } = result;

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

// No session is needed to comment: the poll token cookie proves authorship,
// so a caller can repeat the action under a fresh token and the limit is per
// address.
export const addCommentAction = optionalUserActionClient
  .metadata({ actionName: "add_comment" })
  .use(createRateLimitMiddleware({ requests: 30, duration: "1 m", by: "ip" }))
  .inputSchema(addCommentSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, authorName, content } = parsedInput;

    const heldToken = await getPollToken(pollId);
    const token = heldToken ?? generateAccessToken();

    const result = await addComment({
      pollId,
      userId: ctx.user?.id ?? null,
      isGuest: ctx.user?.isGuest ?? true,
      token,
      authorName,
      content,
    });

    if (!result.ok) {
      return result;
    }

    if (!heldToken) {
      await setPollToken(pollId, token);
    }

    const { comment } = result;

    after(() =>
      sendNewCommentNotificationEmail({
        pollId,
        pollTitle: comment.poll.title,
        authorName: comment.authorName,
        content: comment.content,
        excludeUserId: ctx.user?.id ?? null,
      }),
    );

    trackCommentEvent(ctx.user, "poll_comment_add", pollId, {
      is_guest: ctx.user?.isGuest ?? true,
      auth_method: sessionAuthMethod(ctx.user),
    });

    return { ok: true as const, comment: { id: comment.id } };
  });

/**
 * Three proofs are accepted: a session that wrote the comment, the poll
 * token it was written with, and a session that administers the poll.
 */
export const deleteCommentAction = optionalUserActionClient
  .metadata({ actionName: "delete_comment" })
  .inputSchema(deleteCommentSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { commentId } = parsedInput;
    const { user } = ctx;

    const comment = await getComment({ commentId });

    if (!comment) {
      throw new AppError({ code: "NOT_FOUND", message: "Comment not found" });
    }

    const ownedBySession = !!user && comment.userId === user.id;
    const ownedByToken =
      !ownedBySession &&
      tokensMatch(await getPollToken(comment.pollId), comment.token);
    const isAuthor = ownedBySession || ownedByToken;

    if (
      !isAuthor &&
      !(user && (await hasPollAdminAccess(comment.pollId, user.id)))
    ) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not allowed to delete this comment",
      });
    }

    await deleteComment({ commentId });

    trackCommentEvent(user, "poll_comment_delete", comment.pollId, {
      is_author: isAuthor,
      auth_method: ownedBySession
        ? sessionAuthMethod(user)
        : ownedByToken
          ? "token"
          : "poll_admin",
    });

    return { ok: true as const };
  });
