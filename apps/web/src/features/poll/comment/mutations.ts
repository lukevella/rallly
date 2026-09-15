import "server-only";

import { prisma } from "@rallly/database";
import { revalidatePollPages } from "@/features/poll/mutations";
import { MAX_COMMENT_AUTHOR_NAME_LENGTH } from "@/features/poll/schema";

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
  | { ok: false; reason: "notFound" | "disabled" };

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
      disableComments: true,
      deleted: true,
      user: { select: { banned: true } },
    },
  });

  // A deleted poll, or one whose creator was banned, never accepts new
  // comments.
  if (!poll || poll.deleted || poll.user?.banned) {
    return { ok: false, reason: "notFound" };
  }

  // The comment UI is hidden when the host turns comments off, but the
  // setting is only real if the mutation enforces it too.
  if (poll.disableComments) {
    return { ok: false, reason: "disabled" };
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

  const comment = await prisma.comment.create({
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

  revalidatePollPages();

  return { ok: true, comment };
}

export async function deleteComment({ commentId }: { commentId: string }) {
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePollPages();
}
