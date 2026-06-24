import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { createSpaceInDb, createTestPoll, createUserInDb } from "./test-utils";

/**
 * This test suite tests the house-keeping API endpoints:
 * 1. delete-inactive-polls: Marks inactive polls as deleted
 * 2. remove-deleted-polls: Permanently removes polls that have been marked as deleted for more than 7 days
 * 3. auto-close-polls: Closes open polls whose options have all ended
 */
test.describe("House-keeping API", () => {
  // Store created poll IDs for cleanup
  const createdPollIds: string[] = [];
  const createdUserIds: string[] = [];

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
});
