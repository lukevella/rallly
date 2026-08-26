import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";
import { recordPollActivities } from "@/features/poll/activity/mutations";
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

  const poll = await prisma.$transaction(async (tx) => {
    const poll = await tx.poll.create({
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
        disableComments: true,
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

    await recordPollActivities(tx, [
      {
        pollId: poll.id,
        type: "poll_created",
        userId,
        payload: { title },
      },
    ]);

    return poll;
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
 *
 * `userId` attributes the activity event when the actor is known; API key
 * callers act as the space rather than a user and leave it unset.
 */
export const closePoll = async ({
  pollId,
  spaceId,
  userId,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
  userId?: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const poll = await tx.poll.findFirst({
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

    const closedPoll = await tx.poll.update({
      where: { id: pollId },
      data: { status: "closed", closedReason: "manual" },
      select: pollResponseSelect,
    });

    await recordPollActivities(tx, [
      {
        pollId,
        type: "poll_closed",
        userId: userId ?? null,
        payload: { reason: "manual" },
      },
    ]);

    return closedPoll;
  });
};

/**
 * Reopens a closed poll. Conditional transition, matching closePoll: only the
 * call that actually flips the status appends a lifecycle event, so repeated
 * or concurrent calls can't record a reopen that didn't happen. Scheduled
 * polls are read-only records (there is no unschedule), so only a closed poll
 * can reopen.
 */
export const reopenPoll = async ({
  pollId,
  spaceId,
  userId,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
  userId?: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const poll = await tx.poll.findFirst({
      where: {
        id: pollId,
        spaceId,
        deletedAt: null,
      },
      select: { status: true },
    });

    if (!poll) {
      return { ok: false as const, reason: "notFound" as const };
    }

    if (poll.status === "scheduled" || poll.status === "canceled") {
      return { ok: false as const, reason: "notClosed" as const };
    }

    const { count } = await tx.poll.updateMany({
      where: {
        id: pollId,
        status: "closed",
      },
      data: {
        status: "open",
        closedReason: null,
      },
    });

    // count 0 means the poll was already open (or a concurrent call won the
    // transition) — the desired state holds, but this call records nothing.
    if (count > 0) {
      await recordPollActivities(tx, [
        {
          pollId,
          type: "poll_reopened",
          userId: userId ?? null,
          payload: {},
        },
      ]);
    }

    return { ok: true as const };
  });
};

/**
 * Creates a new open poll from an existing poll's details, settings and
 * options. Responses are not copied — duplication starts a fresh round of
 * scheduling with the same choices.
 */
export const duplicatePoll = async ({
  pollId,
  spaceId,
  userId,
  title,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
  userId: string;
  title: string;
}) => {
  const source = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deletedAt: null,
    },
    select: {
      description: true,
      location: true,
      timeZone: true,
      hideParticipants: true,
      hideScores: true,
      requireParticipantEmail: true,
      disableComments: true,
      kind: true,
      options: {
        select: {
          startTime: true,
          duration: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  if (!source) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const poll = await tx.poll.create({
      data: {
        id: nanoid(),
        title,
        userId,
        spaceId,
        description: source.description,
        location: source.location,
        timeZone: source.timeZone,
        hideParticipants: source.hideParticipants,
        hideScores: source.hideScores,
        requireParticipantEmail: source.requireParticipantEmail,
        disableComments: source.disableComments,
        kind: source.kind,
        options: {
          create: source.options,
        },
      },
      select: { id: true },
    });

    await recordPollActivities(tx, [
      {
        pollId: poll.id,
        type: "poll_created",
        userId,
        payload: { title },
      },
    ]);

    return poll;
  });
};

/**
 * Muting is a per-owner notification preference, so the scope is the owner's
 * userId rather than a space.
 */
export const setPollMuted = async ({
  pollId,
  userId,
  muted,
}: {
  pollId: string;
  userId: string;
  muted: boolean;
}) => {
  const { count } = await prisma.poll.updateMany({
    where: {
      id: pollId,
      userId,
      deletedAt: null,
    },
    data: { muted },
  });

  if (count === 0) {
    return { ok: false as const, reason: "notFound" as const };
  }

  return { ok: true as const };
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
 * delete-inactive-polls keys off. RETURNING feeds the activity writes, which
 * commit in the same transaction as the closes.
 */
export async function autoClosePolls() {
  return prisma.$transaction(
    async (tx) => {
      const closed = await tx.$queryRaw<{ id: string }[]>`
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
      RETURNING p.id
    `;

      await recordPollActivities(
        tx,
        closed.map(({ id }) => ({
          pollId: id,
          type: "poll_closed" as const,
          userId: null,
          payload: { reason: "auto" as const },
        })),
      );

      return closed.length;
    },
    // The UPDATE scans every open poll's options, which can outlast Prisma's
    // 5s default on large instances or after cron downtime.
    { timeout: 30_000 },
  );
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
