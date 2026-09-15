import "server-only";

import { prisma } from "@rallly/database";
import { revalidatePollPages } from "@/features/poll/mutations";
import { MAX_COMMENT_AUTHOR_NAME_LENGTH } from "@/features/poll/schema";

type CommentRefusal = "notFound" | "disabled";

class CommentRefusedError extends Error {
  constructor(public readonly reason: CommentRefusal) {
    super(reason);
  }
}

export type AddCommentResult =
  | {
      ok: true;
      comment: {
        id: string;
        content: string;
        authorName: string;
        poll: { id: string; title: string };
      };
    }
  | { ok: false; reason: CommentRefusal };

export async function addComment({
  pollId,
  userId,
  isGuest,
  authorName,
  content,
}: {
  pollId: string;
  userId: string;
  isGuest: boolean;
  authorName: string;
  content: string;
}): Promise<AddCommentResult> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      user: { select: { banned: true } },
      space: { select: { owner: { select: { banned: true } } } },
    },
  });

  // A poll whose creator or space owner was banned never accepts comments.
  // Bans live on the user rows, so they are checked outside the lock below.
  if (!poll || poll.user?.banned || poll.space?.owner.banned) {
    return { ok: false, reason: "notFound" };
  }

  let name = authorName;

  if (!isGuest) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    });

    // Stored names (e.g. from OAuth sign-up) aren't guaranteed to satisfy
    // the schema cap, so bound them here too.
    name = user.name.trim().slice(0, MAX_COMMENT_AUTHOR_NAME_LENGTH);
  }

  try {
    const comment = await prisma.$transaction(async (tx) => {
      // Locked so the host's delete or comments-off transition, which
      // updates the same row, cannot commit between this check and the
      // insert.
      const [lockedPoll] = await tx.$queryRaw<
        { deleted: boolean; disable_comments: boolean }[]
      >`
        SELECT deleted, disable_comments
        FROM polls WHERE id = ${pollId} FOR UPDATE
      `;

      if (!lockedPoll || lockedPoll.deleted) {
        throw new CommentRefusedError("notFound");
      }

      // The comment UI is hidden when the host turns comments off, but the
      // setting is only real if the mutation enforces it too.
      if (lockedPoll.disable_comments) {
        throw new CommentRefusedError("disabled");
      }

      return tx.comment.create({
        data: {
          content,
          pollId,
          authorName: name,
          userId,
        },
        select: {
          id: true,
          content: true,
          authorName: true,
          poll: { select: { id: true, title: true } },
        },
      });
    });

    revalidatePollPages();

    return { ok: true, comment };
  } catch (error) {
    if (error instanceof CommentRefusedError) {
      return { ok: false, reason: error.reason };
    }
    throw error;
  }
}

export async function deleteComment({ commentId }: { commentId: string }) {
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePollPages();
}
