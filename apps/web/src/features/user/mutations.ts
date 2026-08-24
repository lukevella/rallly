import "server-only";

import type { Prisma, TimeFormat } from "@rallly/database";
import { prisma } from "@rallly/database";
import { authLib } from "@/lib/auth";
import { SESSION_TTL_SECONDS } from "@/lib/auth-config";
import { deleteStoredAsset } from "@/lib/storage/asset-upload";

export async function createUser({
  name,
  email,
  emailVerified,
  image,
  timeZone,
  timeFormat,
  locale,
  weekStart,
}: {
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  timeZone?: string;
  timeFormat?: TimeFormat;
  locale?: string;
  weekStart?: number;
}) {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified,
      image,
      timeZone,
      timeFormat,
      locale,
      weekStart,
      role: "user",
    },
  });

  return user;
}

// There are deliberately no self-profile mutations (name, image,
// localization) here. Writes whose target user is defined by the session
// belong in actions.ts, where they call Better-Auth's updateUser endpoint
// directly — it refreshes the session snapshot in secondary storage and the
// session cookie cache in one step. Mutations only hold writes that target
// an arbitrary userId.

// Role changes must go through Better-Auth's internal adapter so the user
// snapshot cached in each session (secondary storage) gets refreshed — a bare
// Prisma write leaves every active session on the old role, and Better-Auth's
// own permission checks (e.g. banUser) read the session, not the database.
// The admin plugin's setRole endpoint is not used because it authorizes
// against the caller's possibly stale session — authorization is the caller's
// responsibility.
export async function updateUserRole({
  userId,
  role,
}: {
  userId: string;
  role: "user" | "admin";
}) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.updateUser(userId, {
    role,
    updatedAt: new Date(),
  });
}

// Bans must go through Better-Auth rather than Prisma so the user's sessions
// are actually revoked — with secondary storage enabled, sessions live in
// Redis, not the Session table, and only Better-Auth's own APIs delete those
// keys. A bare `banned: true` write leaves the user logged in until their
// session expires. The admin plugin's banUser endpoint is deliberately not
// used: it authorizes against the caller's session snapshot rather than the
// database, and the moderation auto-ban runs without an admin session at all.
// Authorization is the caller's responsibility.

export async function banUser({
  userId,
  reason,
}: {
  userId: string;
  reason?: string;
}) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.updateUser(userId, {
    banned: true,
    banReason: reason ?? null,
    updatedAt: new Date(),
  });

  await internalAdapter.deleteSessions(userId);

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: new Date() },
  });
}

export async function unbanUser({ userId }: { userId: string }) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.updateUser(userId, {
    banned: false,
    banReason: null,
    banExpires: null,
    updatedAt: new Date(),
  });

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: null },
  });
}

// Sessions are revoked through Better-Auth's internal adapter for the same
// reason as bans: with secondary storage they live in Redis, and only
// Better-Auth's own APIs delete those keys.
export async function hardDeleteUser({ userId }: { userId: string }) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.deleteSessions(userId);

  // The avatar lives in object storage, outside the cascade. External URLs
  // (OAuth provider avatars) are not ours to delete.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (user?.image) {
    await deleteStoredAsset(user.image);
  }

  // Cascades cover content the user owns. Everything on other people's polls
  // and events (participants, votes, invites, activity log) is that record's
  // data, not the account's — deletion never mutates it, so finalized
  // outcomes, attendance, and activity history can't change when an account
  // disappears. The FK SetNulls unlink participants and event invites;
  // PollActivity's soft refs persist as inert identity that resolves to nothing.
  await prisma.user.delete({ where: { id: userId } });
}

const DELETE_ORPHANED_ANONYMOUS_USERS_BATCH_SIZE = 500;

// Hard ceiling on one invocation. The job runs hourly, so capacity is
// 500/hour against an arrival rate well under that — the cap exists so a
// run's cost stays flat regardless of how much backlog is waiting, rather
// than to keep pace on its own. An unbounded loop is what timed out when
// the cron was first enabled: the eligibility predicate spans fifteen
// relations, so re-deriving it per batch is the dominant cost, and a large
// backlog made the number of derivations unbounded too.
//
// A backlog therefore drains over hours rather than in one run, which is
// the intended behaviour: this job maintains a steady state. A one-time
// accumulation (a migration backfill, a long outage) wants a supervised
// drain, not a bigger ceiling here.
const DELETE_ORPHANED_ANONYMOUS_USERS_MAX_PER_RUN = 500;

/**
 * Delete orphaned anonymous guest users: guests that own no resources and
 * haven't been seen for longer than the session length.
 *
 * Two guards, both required:
 *  - The `lastSeenAt` window IS the liveness check. Prod sessions live in
 *    Redis, so we can't probe them at delete time. What rules out a live
 *    session is the session TTL: it equals this window, so any session
 *    belonging to a guest below the cutoff has already expired. `lastSeenAt`
 *    is a lower bound on that expiry, not a record of it — a returning guest
 *    gets a fresh session, and `session.create` writes `lastSeenAt`, lifting
 *    them back above the cutoff. Note the value can also predate any session
 *    at all: rows carrying the column's backfill default were never observed,
 *    so read a stale `lastSeenAt` as "no session since", not "last active at".
 *  - The resource filter guards the cascade. A guest's polls/comments are
 *    onDelete: Cascade, so deleting one who still owns a live poll would
 *    destroy everyone's votes/comments.
 *
 * `scheduledEventInvites` is the invitee link (invitee_id, SetNull); a guest
 * on that relation is a live participant elsewhere and must be retained.
 *
 * The filter below is the canonical list of guarded relations, and it must
 * stay exhaustive: every `onDelete: Cascade` relation on `User` is inside
 * this delete's blast radius. `scripts/check-user-cascade-relations.mjs`
 * fails CI when the schema grows one that is neither guarded here nor
 * recorded as deliberately ignored (auth plumbing — sessions, accounts,
 * notification preferences — which every guest has and which hold no data
 * worth keeping).
 *
 * Most of these can't be reached by an anonymous guest today: the
 * user-create hook in `lib/auth.ts` returns early for anonymous users, so no
 * space is provisioned and the space-scoped relations stay empty. That is an
 * application-code invariant, not a database constraint, so the filter does
 * not rely on it holding.
 */
export async function deleteOrphanedAnonymousUsers() {
  const cutoff = new Date(Date.now() - SESSION_TTL_SECONDS * 1000);

  // Both guards live here so read and delete share exactly one predicate.
  const orphanedAnonymousFilter = {
    isAnonymous: true,
    lastSeenAt: { lt: cutoff },
    polls: { none: {} },
    comments: { none: {} },
    participants: { none: {} },
    scheduledEventInvites: { none: {} },
    scheduledEvents: { none: {} },
    hostedEventTypes: { none: {} },
    hostedSheets: { none: {} },
    spaces: { none: {} },
    memberOf: { none: {} },
    spaceMemberInvites: { none: {} },
    subscriptions: { none: {} },
    paymentMethods: { none: {} },
    calendarConnections: { none: {} },
    credentials: { none: {} },
  } satisfies Prisma.UserWhereInput;

  let deleted = 0;

  while (deleted < DELETE_ORPHANED_ANONYMOUS_USERS_MAX_PER_RUN) {
    const batch = await prisma.user.findMany({
      where: orphanedAnonymousFilter,
      select: { id: true },
      take: Math.min(
        DELETE_ORPHANED_ANONYMOUS_USERS_BATCH_SIZE,
        DELETE_ORPHANED_ANONYMOUS_USERS_MAX_PER_RUN - deleted,
      ),
    });

    if (batch.length === 0) {
      break;
    }

    // Re-apply the guards at delete time, not just id: a poll/comment/invite
    // created — or an account linked out of anonymous — between this snapshot
    // and the delete would otherwise be cascaded away. Any batched id that
    // fails the re-check is simply left for the next findMany to exclude.
    const { count } = await prisma.user.deleteMany({
      where: {
        AND: [orphanedAnonymousFilter, { id: { in: batch.map((u) => u.id) } }],
      },
    });

    deleted += count;

    // A batch can select rows that the re-check then rejects, and a fully
    // rejected batch leaves `deleted` unmoved. Those rows no longer match the
    // filter, so the next pass excludes them — but only once the write that
    // disqualified them is visible here, so stop rather than risk re-selecting
    // the same batch indefinitely. The next scheduled run picks up the rest.
    if (count < batch.length) {
      break;
    }
  }

  return deleted;
}

export async function setActiveSpace({
  userId,
  spaceId,
}: {
  userId: string;
  spaceId: string;
}) {
  return await prisma.spaceMember.update({
    where: {
      spaceId_userId: {
        spaceId: spaceId,
        userId: userId,
      },
    },
    data: {
      lastSelectedAt: new Date(),
    },
  });
}
