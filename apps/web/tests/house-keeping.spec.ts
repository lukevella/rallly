import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { SESSION_TTL_SECONDS } from "@/lib/auth-config";
import { createSpaceInDb, createTestPoll, createUserInDb } from "./test-utils";

/**
 * This test suite tests the house-keeping API endpoints:
 * 1. delete-inactive-polls: Marks inactive polls as deleted
 * 2. remove-deleted-polls: Permanently removes polls that have been marked as deleted for more than 7 days
 * 3. auto-close-polls: Closes open polls whose options have all ended
 * 4. delete-orphaned-anonymous-users: Deletes idle guests that own no resources
 */

// Session length; anything below now - this cutoff is provably session-less.
// Derived from the production constant so the boundary can't silently drift.
const SESSION_TTL_DAYS = SESSION_TTL_SECONDS / (60 * 60 * 24);
test.describe("House-keeping API", () => {
  // Store created poll IDs for cleanup
  const createdPollIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdScheduledEventIds: string[] = [];

  // API Secret for authentication
  const CRON_SECRET = process.env.CRON_SECRET;

  test.beforeAll(async () => {
    // Clean up any existing test data
    await cleanup();
  });

  test.afterAll(async () => {
    // Clean up test data
    await cleanup();
  });

  async function cleanup() {
    // Scheduled events (and their invites, via cascade) must go before their
    // host users are deleted, since the host relation is the cascade root.
    if (createdScheduledEventIds.length > 0) {
      await prisma.scheduledEvent.deleteMany({
        where: {
          id: {
            in: createdScheduledEventIds,
          },
        },
      });
      createdScheduledEventIds.length = 0;
    }

    // Delete test users - related polls will be deleted automatically due to cascade
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds,
          },
        },
      });
      createdUserIds.length = 0;
    }

    // Delete polls that don't have a user (not covered by cascade delete)
    if (createdPollIds.length > 0) {
      await prisma.poll.deleteMany({
        where: {
          id: {
            in: createdPollIds,
          },
          userId: null,
        },
      });
      createdPollIds.length = 0;
    }
  }

  test("should mark inactive polls as deleted except for polls in spaces with active subscriptions", async ({
    request,
    baseURL,
  }) => {
    // Create test users
    const freeUser = await createUserInDb({
      name: "Free User",
      email: "free-user@example.com",
    });
    createdUserIds.push(freeUser.id);

    const spaceOwner = await createUserInDb({
      name: "Space Owner",
      email: "space-owner@example.com",
    });
    createdUserIds.push(spaceOwner.id);

    // Create a space with an active subscription
    const paidSpace = await createSpaceInDb({
      name: "Paid Space",
      ownerId: spaceOwner.id,
      tier: "pro",
    });

    // Create test polls - These should be marked as deleted (free space, old, no future dates)
    const oldPollFromFreeUser = await createTestPoll({
      id: "old-poll-free-user",
      title: "Old Poll from Free User",
      userId: freeUser.id,
      updatedAt: dayjs().subtract(35, "day").toDate(),
    });
    createdPollIds.push(oldPollFromFreeUser.id);

    const oldPollNoUser = await createTestPoll({
      id: "old-poll-no-user",
      title: "Old Poll with No User",
      updatedAt: dayjs().subtract(35, "day").toDate(),
    });
    createdPollIds.push(oldPollNoUser.id);

    // These should NOT be marked as deleted
    const oldPollInPaidSpace = await createTestPoll({
      id: "old-poll-paid-space",
      title: "Old Poll in Paid Space",
      userId: spaceOwner.id,
      spaceId: paidSpace.id,
      updatedAt: dayjs().subtract(35, "day").toDate(),
    });
    createdPollIds.push(oldPollInPaidSpace.id);

    const recentPollFromFreeUser = await createTestPoll({
      id: "recent-poll-free-user",
      title: "Recent Poll from Free User",
      userId: freeUser.id,
      updatedAt: dayjs().subtract(15, "day").toDate(),
    });
    createdPollIds.push(recentPollFromFreeUser.id);

    const oldPollWithFutureOptions = await createTestPoll({
      id: "old-poll-future-options",
      title: "Old Poll with Future Options",
      userId: freeUser.id,
      updatedAt: dayjs().subtract(35, "day").toDate(),
      hasFutureOptions: true,
    });
    createdPollIds.push(oldPollWithFutureOptions.id);

    // Protected: old/unedited, but a participant responded (or changed their
    // vote) recently
    const oldPollWithRecentParticipant = await createTestPoll({
      id: "old-poll-recent-participant",
      title: "Old Poll with Recent Participant",
      userId: freeUser.id,
      updatedAt: dayjs().subtract(35, "day").toDate(),
      participantActiveAt: dayjs().subtract(15, "day").toDate(),
    });
    createdPollIds.push(oldPollWithRecentParticipant.id);

    // Protected: old/unedited, but someone commented recently
    const oldPollWithRecentComment = await createTestPoll({
      id: "old-poll-recent-comment",
      title: "Old Poll with Recent Comment",
      userId: freeUser.id,
      updatedAt: dayjs().subtract(35, "day").toDate(),
      commentCreatedAt: dayjs().subtract(15, "day").toDate(),
    });
    createdPollIds.push(oldPollWithRecentComment.id);

    // Should be deleted: has activity, but all of it is older than 30 days
    // (proves the check is recency-based, not mere existence)
    const oldPollWithOldActivity = await createTestPoll({
      id: "old-poll-old-activity",
      title: "Old Poll with Old Activity",
      userId: freeUser.id,
      updatedAt: dayjs().subtract(35, "day").toDate(),
      participantActiveAt: dayjs().subtract(35, "day").toDate(),
      commentCreatedAt: dayjs().subtract(40, "day").toDate(),
    });
    createdPollIds.push(oldPollWithOldActivity.id);

    // Call the delete-inactive-polls endpoint
    const response = await request.get(
      `${baseURL}/api/house-keeping/delete-inactive-polls`,
      {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      },
    );

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    expect(responseData.success).toBeTruthy();

    // We expect 3 polls to be marked as deleted:
    // - Old poll from free user (not in a paid space)
    // - Old poll without a user
    // - Old poll whose only participant/comment activity is also older than 30 days
    expect(responseData.summary.markedDeleted).toBe(3);

    // Verify polls that should be marked as deleted
    const deletedPollFromFreeUser = await prisma.poll.findUnique({
      where: { id: oldPollFromFreeUser.id },
    });
    expect(deletedPollFromFreeUser?.deleted).toBe(true);
    expect(deletedPollFromFreeUser?.deletedAt).not.toBeNull();

    const deletedPollNoUser = await prisma.poll.findUnique({
      where: { id: oldPollNoUser.id },
    });
    expect(deletedPollNoUser?.deleted).toBe(true);
    expect(deletedPollNoUser?.deletedAt).not.toBeNull();

    // Verify polls that should NOT be marked as deleted
    const protectedPollInPaidSpace = await prisma.poll.findUnique({
      where: { id: oldPollInPaidSpace.id },
    });
    expect(protectedPollInPaidSpace?.deleted).toBe(false);
    expect(protectedPollInPaidSpace?.deletedAt).toBeNull();

    const protectedRecentPoll = await prisma.poll.findUnique({
      where: { id: recentPollFromFreeUser.id },
    });
    expect(protectedRecentPoll?.deleted).toBe(false);
    expect(protectedRecentPoll?.deletedAt).toBeNull();

    const protectedPollWithFutureOptions = await prisma.poll.findUnique({
      where: { id: oldPollWithFutureOptions.id },
    });
    expect(protectedPollWithFutureOptions?.deleted).toBe(false);
    expect(protectedPollWithFutureOptions?.deletedAt).toBeNull();

    const protectedPollWithRecentParticipant = await prisma.poll.findUnique({
      where: { id: oldPollWithRecentParticipant.id },
    });
    expect(protectedPollWithRecentParticipant?.deleted).toBe(false);
    expect(protectedPollWithRecentParticipant?.deletedAt).toBeNull();

    const protectedPollWithRecentComment = await prisma.poll.findUnique({
      where: { id: oldPollWithRecentComment.id },
    });
    expect(protectedPollWithRecentComment?.deleted).toBe(false);
    expect(protectedPollWithRecentComment?.deletedAt).toBeNull();

    // The poll whose activity is all older than 30 days should be deleted
    const deletedPollWithOldActivity = await prisma.poll.findUnique({
      where: { id: oldPollWithOldActivity.id },
    });
    expect(deletedPollWithOldActivity?.deleted).toBe(true);
    expect(deletedPollWithOldActivity?.deletedAt).not.toBeNull();
  });

  test("should permanently remove polls that have been marked as deleted for more than 7 days", async ({
    request,
    baseURL,
  }) => {
    // Create a poll that was marked as deleted more than 7 days ago
    const oldDeletedPoll = await prisma.poll.create({
      data: {
        id: "old-deleted-poll",
        title: "Old Deleted Poll",
        participantUrlId: "old-deleted-poll-participant",
        adminUrlId: "old-deleted-poll-admin",
        deleted: true,
        deletedAt: dayjs().subtract(8, "day").toDate(), // Deleted 8 days ago
      },
    });
    createdPollIds.push(oldDeletedPoll.id);

    // Create a poll that was marked as deleted less than 7 days ago
    const recentDeletedPoll = await prisma.poll.create({
      data: {
        id: "recent-deleted-poll",
        title: "Recent Deleted Poll",
        participantUrlId: "recent-deleted-poll-participant",
        adminUrlId: "recent-deleted-poll-admin",
        deleted: true,
        deletedAt: dayjs().subtract(3, "day").toDate(), // Deleted 3 days ago
      },
    });
    createdPollIds.push(recentDeletedPoll.id);

    // Call the remove-deleted-polls endpoint
    const response = await request.get(
      `${baseURL}/api/house-keeping/remove-deleted-polls`,
      {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      },
    );

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    expect(responseData.success).toBeTruthy();

    // We expect 1 poll to be permanently deleted
    expect(responseData.summary.deleted.polls).toBe(1);

    // Verify that the old deleted poll is gone
    const checkOldDeletedPoll = await prisma.poll.findUnique({
      where: { id: oldDeletedPoll.id },
    });
    expect(checkOldDeletedPoll).toBeNull();

    // Verify that the recent deleted poll still exists
    const checkRecentDeletedPoll = await prisma.poll.findUnique({
      where: { id: recentDeletedPoll.id },
    });
    expect(checkRecentDeletedPoll).not.toBeNull();
    expect(checkRecentDeletedPoll?.deleted).toBe(true);
  });

  test("should close open polls whose options have all ended, leaving others untouched", async ({
    request,
    baseURL,
  }) => {
    // Should be closed: open poll whose only option ended in the past
    const allPast = await prisma.poll.create({
      data: {
        id: "ac-all-past",
        title: "Auto-close: all options in the past",
        participantUrlId: "ac-all-past-participant",
        adminUrlId: "ac-all-past-admin",
        options: {
          create: {
            startTime: dayjs().subtract(10, "day").toDate(),
            duration: 60,
          },
        },
      },
    });
    createdPollIds.push(allPast.id);

    // Should be closed: all-day option (duration 0), treated as ending 24h after
    // its start, whose date is well in the past
    const allDayPast = await prisma.poll.create({
      data: {
        id: "ac-allday-past",
        title: "Auto-close: past all-day option",
        participantUrlId: "ac-allday-past-participant",
        adminUrlId: "ac-allday-past-admin",
        options: {
          create: {
            startTime: dayjs().subtract(5, "day").toDate(),
            duration: 0,
          },
        },
      },
    });
    createdPollIds.push(allDayPast.id);

    // Should stay open: has a future option
    const futureOption = await prisma.poll.create({
      data: {
        id: "ac-future",
        title: "Auto-close: has a future option",
        participantUrlId: "ac-future-participant",
        adminUrlId: "ac-future-admin",
        options: {
          create: {
            startTime: dayjs().add(10, "day").toDate(),
            duration: 60,
          },
        },
      },
    });
    createdPollIds.push(futureOption.id);

    // Should stay open: one past and one future option
    const mixed = await prisma.poll.create({
      data: {
        id: "ac-mixed",
        title: "Auto-close: past and future options",
        participantUrlId: "ac-mixed-participant",
        adminUrlId: "ac-mixed-admin",
        options: {
          create: [
            { startTime: dayjs().subtract(10, "day").toDate(), duration: 60 },
            { startTime: dayjs().add(10, "day").toDate(), duration: 60 },
          ],
        },
      },
    });
    createdPollIds.push(mixed.id);

    // Should stay open: option started in the past but is still running (its end
    // is in the future) — proves the check uses the option's END, not its start
    const stillRunning = await prisma.poll.create({
      data: {
        id: "ac-running",
        title: "Auto-close: option still running",
        participantUrlId: "ac-running-participant",
        adminUrlId: "ac-running-admin",
        options: {
          create: {
            startTime: dayjs().subtract(30, "minute").toDate(),
            duration: 120,
          },
        },
      },
    });
    createdPollIds.push(stillRunning.id);

    // Should stay open: no options at all (unlike delete-inactive, auto-close
    // ignores polls that have no dates to be in the past)
    const noOptions = await prisma.poll.create({
      data: {
        id: "ac-no-options",
        title: "Auto-close: no options",
        participantUrlId: "ac-no-options-participant",
        adminUrlId: "ac-no-options-admin",
      },
    });
    createdPollIds.push(noOptions.id);

    // Should stay scheduled: only open polls are auto-closed
    const scheduled = await prisma.poll.create({
      data: {
        id: "ac-scheduled",
        title: "Auto-close: already scheduled",
        participantUrlId: "ac-scheduled-participant",
        adminUrlId: "ac-scheduled-admin",
        status: "scheduled",
        options: {
          create: {
            startTime: dayjs().subtract(10, "day").toDate(),
            duration: 60,
          },
        },
      },
    });
    createdPollIds.push(scheduled.id);

    const response = await request.get(
      `${baseURL}/api/house-keeping/auto-close-polls`,
      {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      },
    );

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    expect(responseData.success).toBeTruthy();

    const statusOf = async (id: string) =>
      (await prisma.poll.findUnique({ where: { id } }))?.status;

    expect(await statusOf(allPast.id)).toBe("closed");
    expect(await statusOf(allDayPast.id)).toBe("closed");

    expect(await statusOf(futureOption.id)).toBe("open");
    expect(await statusOf(mixed.id)).toBe("open");
    expect(await statusOf(stillRunning.id)).toBe("open");
    expect(await statusOf(noOptions.id)).toBe("open");
    expect(await statusOf(scheduled.id)).toBe("scheduled");
  });

  test("should delete only orphaned anonymous guests idle longer than the session length", async ({
    request,
    baseURL,
  }) => {
    const stale = dayjs()
      .subtract(SESSION_TTL_DAYS + 1, "day")
      .toDate();
    const recent = dayjs()
      .subtract(SESSION_TTL_DAYS - 1, "day")
      .toDate();

    // Should be deleted: stale guest with no resources.
    const orphanedGuest = await createUserInDb({
      name: "Orphaned Guest",
      email: "orphaned-guest@example.com",
      isAnonymous: true,
      lastSeenAt: stale,
    });
    createdUserIds.push(orphanedGuest.id);

    // Retained (window): guest seen within the session length.
    const recentGuest = await createUserInDb({
      name: "Recent Guest",
      email: "recent-guest@example.com",
      isAnonymous: true,
      lastSeenAt: recent,
    });
    createdUserIds.push(recentGuest.id);

    // Retained (cascade guard): stale guest who still owns a poll.
    const guestWithPoll = await createUserInDb({
      name: "Guest With Poll",
      email: "guest-with-poll@example.com",
      isAnonymous: true,
      lastSeenAt: stale,
    });
    createdUserIds.push(guestWithPoll.id);
    const guestPoll = await createTestPoll({
      id: "orphaned-guest-poll",
      title: "Guest Poll",
      userId: guestWithPoll.id,
      updatedAt: stale,
    });
    createdPollIds.push(guestPoll.id);

    // Retained (resource guard): stale guest who is a participant on a poll.
    const guestParticipant = await createUserInDb({
      name: "Guest Participant",
      email: "guest-participant@example.com",
      isAnonymous: true,
      lastSeenAt: stale,
    });
    createdUserIds.push(guestParticipant.id);
    const hostedPoll = await createTestPoll({
      id: "orphaned-guest-host-poll",
      title: "Host Poll",
      updatedAt: stale,
    });
    createdPollIds.push(hostedPoll.id);
    await prisma.participant.create({
      data: {
        name: "Guest Participant",
        pollId: hostedPoll.id,
        userId: guestParticipant.id,
      },
    });

    // Retained (resource guard): stale guest linked via a scheduled event
    // invite (invitee_id). Needs a registered host to own the event + space.
    const eventHost = await createUserInDb({
      name: "Event Host",
      email: "orphaned-guest-event-host@example.com",
    });
    createdUserIds.push(eventHost.id);
    const hostSpace = await prisma.space.findFirstOrThrow({
      where: { ownerId: eventHost.id },
    });
    const guestInvitee = await createUserInDb({
      name: "Guest Invitee",
      email: "guest-invitee@example.com",
      isAnonymous: true,
      lastSeenAt: stale,
    });
    createdUserIds.push(guestInvitee.id);
    const scheduledEvent = await prisma.scheduledEvent.create({
      data: {
        userId: eventHost.id,
        spaceId: hostSpace.id,
        title: "Orphaned Guest Event",
        uid: "orphaned-guest-event-uid",
        start: dayjs().add(1, "day").toDate(),
        end: dayjs().add(1, "day").add(1, "hour").toDate(),
        invites: {
          create: {
            uid: "orphaned-guest-invite-uid",
            inviteeName: "Guest Invitee",
            inviteeEmail: guestInvitee.email,
            inviteeId: guestInvitee.id,
          },
        },
      },
    });
    createdScheduledEventIds.push(scheduledEvent.id);

    // Critical: a stale registered user with no resources must never be reaped.
    const staleRealUser = await createUserInDb({
      name: "Stale Real User",
      email: "orphaned-stale-real-user@example.com",
      lastSeenAt: stale,
    });
    createdUserIds.push(staleRealUser.id);

    const response = await request.get(
      `${baseURL}/api/house-keeping/delete-orphaned-anonymous-users`,
      {
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      },
    );

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    expect(responseData.success).toBeTruthy();
    expect(responseData.summary.deleted.anonymousUsers).toBe(1);

    const exists = async (id: string) =>
      (await prisma.user.findUnique({ where: { id } })) !== null;

    expect(await exists(orphanedGuest.id)).toBe(false);
    expect(await exists(recentGuest.id)).toBe(true);
    expect(await exists(guestWithPoll.id)).toBe(true);
    expect(await exists(guestParticipant.id)).toBe(true);
    expect(await exists(guestInvitee.id)).toBe(true);
    expect(await exists(staleRealUser.id)).toBe(true);
  });
});
