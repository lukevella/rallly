import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";
import type { AuthorizedSpaceId } from "@/features/space/types";

export type PollOption = {
  startTime: Date;
  duration: number;
};

export type CreatePollParams = {
  userId: string;
  title: string;
  description?: string;
  location?: string;
  timeZone?: string;
  requireParticipantEmail?: boolean;
  hideParticipants?: boolean;
  hideScores?: boolean;
  disableComments?: boolean;
  options: PollOption[];
  spaceId: AuthorizedSpaceId;
};

export const createPoll = async ({
  userId,
  title,
  description,
  location,
  timeZone,
  requireParticipantEmail,
  hideParticipants,
  hideScores,
  disableComments,
  options,
  spaceId,
}: CreatePollParams) => {
  const kind = options.some((o) => o.duration > 0) ? "time" : "date";

  const poll = await prisma.poll.create({
    data: {
      id: nanoid(),
      title,
      description,
      location,
      timeZone,
      requireParticipantEmail,
      hideParticipants,
      hideScores,
      disableComments,
      adminUrlId: nanoid(),
      participantUrlId: nanoid(),
      userId,
      spaceId,
      kind,
      options: { createMany: { data: options } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      timeZone: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      options: {
        select: {
          id: true,
          startTime: true,
          duration: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  return poll;
};

const pollResponseSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  timeZone: true,
  status: true,
  createdAt: true,
  user: {
    select: {
      name: true,
      image: true,
    },
  },
  options: {
    select: {
      id: true,
      startTime: true,
      duration: true,
    },
    orderBy: {
      startTime: "asc",
    },
  },
} satisfies Prisma.PollSelect;

/**
 * Closes a poll manually. Idempotent: closing an already-closed poll returns
 * the poll unchanged without altering its `closedReason` (so a poll auto-closed
 * by the cron job keeps `closedReason: "auto"`). Returns `null` when the poll
 * does not exist in the space, letting the caller surface a 404.
 */
export const closePoll = async ({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
}) => {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deletedAt: null,
    },
    select: pollResponseSelect,
  });

  if (!poll) {
    return null;
  }

  if (poll.status === "closed") {
    return poll;
  }

  return prisma.poll.update({
    where: { id: pollId },
    data: { status: "closed", closedReason: "manual" },
    select: pollResponseSelect,
  });
};

export const deletePoll = async (
  pollId: string,
  spaceId: AuthorizedSpaceId,
) => {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!poll) {
    return null;
  }

  await prisma.poll.update({
    where: { id: pollId },
    data: { deleted: true, deletedAt: new Date() },
  });

  return { id: pollId };
};

/**
 * Assigns a user's space-less polls to the given space. Guest linking can
 * migrate polls before the user has a space (the linking runs ahead of
 * space provisioning on sign-up, and an existing account may have lost all
 * its spaces), so every place that creates a user's space adopts them.
 */
export async function adoptOrphanedPolls({
  userId,
  spaceId,
}: {
  userId: string;
  spaceId: string;
}) {
  await prisma.poll.updateMany({
    where: {
      userId,
      spaceId: null,
    },
    data: {
      spaceId,
    },
  });
}

/**
 * Marks inactive polls as deleted. A poll is inactive when every date has
 * passed at least 30 days ago and there has been no activity (poll edits,
 * participant responses, new comments) in the last 30 days. This guarantees
 * polls are kept for at least 30 days after their final date, and activity
 * extends that.
 * Only marks polls as deleted if they belong to spaces without an active
 * subscription or if they don't have a space associated with them.
 */
export async function deleteInactivePolls() {
  // Define the 30-day threshold once
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Mark inactive polls as deleted in a single query
  const { count: markedDeleted } = await prisma.poll.updateMany({
    where: {
      deleted: false,
      // All poll dates passed at least 30 days ago
      options: {
        none: {
          startTime: { gt: thirtyDaysAgo },
        },
      },
      // We don't delete polls that belong to a space with an active subscription
      OR: [
        { spaceId: null },
        {
          space: {
            tier: {
              not: "pro",
            },
          },
        },
      ],
      // Poll is inactive: not edited, and no participant activity (new or
      // updated responses) or new comments in the last 30 days
      updatedAt: { lt: thirtyDaysAgo },
      participants: {
        none: { updatedAt: { gte: thirtyDaysAgo } },
      },
      comments: {
        none: { createdAt: { gte: thirtyDaysAgo } },
      },
    },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });

  return markedDeleted;
}

/**
 * Closes polls whose options have all ended — i.e. no option ends in the
 * future, where an option ends at start_time + duration (all-day options, with
 * duration 0, are treated as ending 24h after their start). Closing is
 * non-destructive: the poll becomes read-only but is preserved.
 *
 * Raw SQL because the option-end comparison (start_time + duration) can't be
 * expressed in a Prisma `where`. It also deliberately does not touch
 * `updated_at`, so closing a poll doesn't reset the inactivity clock that
 * delete-inactive-polls keys off.
 */
export async function autoClosePolls() {
  const closed = await prisma.$executeRaw`
    UPDATE polls p
    SET status = 'closed', closed_reason = 'auto'
    WHERE p.status = 'open'
      AND p.deleted = false
      AND EXISTS (SELECT 1 FROM options o WHERE o.poll_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM options o
        WHERE o.poll_id = p.id
          AND o.start_time + (CASE WHEN o.duration_minutes = 0
                THEN interval '24 hours'
                ELSE make_interval(mins => o.duration_minutes) END) > (now() AT TIME ZONE 'UTC')
      )
  `;

  return closed;
}

const REMOVE_DELETED_POLLS_BATCH_SIZE = 100;

/**
 * Remove polls and corresponding data that have been marked deleted for more than 7 days.
 */
export async function removeDeletedPolls() {
  // First get the ids of all the polls that have been marked as deleted for at least 7 days
  let totalDeletedPolls = 0;
  let hasMore = true;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  while (hasMore) {
    const batch = await prisma.poll.findMany({
      where: {
        deleted: true,
        deletedAt: {
          lt: sevenDaysAgo,
        },
      },
      select: { id: true },
      take: REMOVE_DELETED_POLLS_BATCH_SIZE,
    });

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    const deleted = await prisma.poll.deleteMany({
      where: {
        id: { in: batch.map((poll) => poll.id) },
      },
    });

    totalDeletedPolls += deleted.count;
  }

  return totalDeletedPolls;
}
