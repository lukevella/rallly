import "server-only";

import { cache } from "react";
import { canUserManagePoll, listPollComments } from "@/features/poll/data";
import { loadPollDetails } from "@/features/poll/loaders";
import { filterCommentsForViewer } from "@/features/poll/utils";
import { getSession } from "@/lib/auth";

/**
 * The name and email a signed-in viewer's new response starts with. Null for
 * a guest or no session. Trusts the session cookie cache: these only fill
 * fields the viewer can still change.
 */
export const loadOptionalResponder = cache(async () => {
  const session = await getSession();
  const user = session?.user;

  if (!user || user.isGuest) {
    return null;
  }

  return { name: user.name, email: user.email };
});

/**
 * The poll's comments as this viewer may see them, oldest first. Empty when
 * comments are off. A poll that hides participants shows a viewer only
 * their own.
 */
export const loadVoteComments = cache(async (pollId: string) => {
  const [poll, session, canManage] = await Promise.all([
    loadPollDetails(pollId),
    getSession(),
    loadCanManagePoll(pollId),
  ]);

  if (!poll || poll.disableComments) {
    return [];
  }

  const viewerUserId = session?.user?.id ?? null;
  const comments = filterCommentsForViewer({
    comments: await listPollComments({ pollId }),
    viewerUserId,
    hideParticipants: poll.hideParticipants,
  });

  return comments.map((comment) => {
    const isOwn = viewerUserId !== null && comment.userId === viewerUserId;
    return {
      id: comment.id,
      authorName: comment.authorName,
      content: comment.content,
      createdAt: comment.createdAt,
      isOwn,
      canDelete: isOwn || canManage,
    };
  });
});

/**
 * Whether the viewer may manage this poll: its owner, or a member of the
 * space it belongs to when that space is shared. Returns false rather than
 * redirecting, because the invite page shows everyone the participant view
 * and only offers the host a way through to the admin page.
 */
export const loadCanManagePoll = cache(async (pollId: string) => {
  const [poll, session] = await Promise.all([
    loadPollDetails(pollId),
    getSession(),
  ]);

  const user = session?.user;
  if (!poll || !user) {
    return false;
  }

  return canUserManagePoll(user, poll);
});
