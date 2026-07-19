import "server-only";

import type { TimeFormat } from "@rallly/database";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import {
  cancelUserSubscriptions,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import { getAccountDeletionCutoff } from "@/features/user/utils";
import { authLib } from "@/lib/auth";
import { deletePostHogPerson } from "@/lib/posthog";

const logger = createLogger("user/mutations");

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
export async function hardDeleteUser({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.deleteSessions(userId);

  // Cascades cover data the user owns, but their personal data also lives
  // where they took part in other users' content: participant rows carry
  // name/email (votes cascade off them, matching the promise in the delete
  // dialog) and event invites carry invitee name/email. Both relations are
  // SetNull, so the rows would otherwise outlive the account.
  await prisma.participant.deleteMany({ where: { userId } });
  await prisma.scheduledEventInvite.deleteMany({
    where: { OR: [{ inviteeId: userId }, { inviteeEmail: email }] },
  });

  await prisma.user.delete({ where: { id: userId } });
}

const REMOVE_DELETED_USERS_BATCH_SIZE = 50;

/**
 * House-keeping reaper: permanently removes accounts whose deletion was
 * scheduled more than the recovery window ago. External stores go first —
 * Stripe (defensive subscription cancel, then the customer object; invoices
 * are lawfully retained by Stripe) and PostHog — so a failure there leaves
 * the user row in place for the next run to retry.
 */
export async function removeDeletedUsers() {
  const cutoff = getAccountDeletionCutoff();
  const failedUserIds: string[] = [];
  let deletedUsers = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: { lt: cutoff },
        id: { notIn: failedUserIds },
      },
      select: { id: true, email: true, customerId: true },
      take: REMOVE_DELETED_USERS_BATCH_SIZE,
    });

    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      try {
        await cancelUserSubscriptions({ userId: user.id });

        if (user.customerId) {
          await deleteStripeCustomer({ customerId: user.customerId });
        }

        await deletePostHogPerson({ distinctId: user.id });

        await hardDeleteUser({ userId: user.id, email: user.email });

        deletedUsers++;
      } catch (error) {
        logger.error(
          { userId: user.id, error },
          "Failed to remove user scheduled for deletion",
        );
        failedUserIds.push(user.id);
      }
    }
  }

  return deletedUsers;
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
