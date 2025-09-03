import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { createUserInDb, createSpaceWithSubscription, createTestPoll } from "./test-utils";

/**
 * This test suite tests the house-keeping API endpoints:
 * 1. delete-inactive-polls: Marks inactive polls as deleted
 * 2. remove-deleted-polls: Permanently removes polls that have been marked as deleted for more than 7 days
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
    const paidSpace = await createSpaceWithSubscription({
      name: "Paid Space",
      ownerId: spaceOwner.id,
      subscriptionId: "sub_test_paid",
    });

    // Create test polls - These should be marked as deleted (free space, old, no future dates)
    const oldPollFromFreeUser = await createTestPoll({
      id: "old-poll-free-user",
      title: "Old Poll from Free User",
      userId: freeUser.id,
      touchedAt: dayjs().subtract(35, "day").toDate(),
    });
    createdPollIds.push(oldPollFromFreeUser.id);

    const oldPollNoUser = await createTestPoll({
      id: "old-poll-no-user",
      title: "Old Poll with No User",
      touchedAt: dayjs().subtract(35, "day").toDate(),
    });
    createdPollIds.push(oldPollNoUser.id);

    // These should NOT be marked as deleted
    const oldPollInPaidSpace = await createTestPoll({
      id: "old-poll-paid-space",
      title: "Old Poll in Paid Space",
      userId: spaceOwner.id,
      spaceId: paidSpace.id,
      touchedAt: dayjs().subtract(35, "day").toDate(),
    });
    createdPollIds.push(oldPollInPaidSpace.id);

    const recentPollFromFreeUser = await createTestPoll({
      id: "recent-poll-free-user",
      title: "Recent Poll from Free User",
      userId: freeUser.id,
      touchedAt: dayjs().subtract(15, "day").toDate(),
    });
    createdPollIds.push(recentPollFromFreeUser.id);

    const oldPollWithFutureOptions = await createTestPoll({
      id: "old-poll-future-options",
      title: "Old Poll with Future Options",
      userId: freeUser.id,
      touchedAt: dayjs().subtract(35, "day").toDate(),
      hasFutureOptions: true,
    });
    createdPollIds.push(oldPollWithFutureOptions.id);

    const oldPollWithRecentViews = await createTestPoll({
      id: "old-poll-recent-views",
      title: "Old Poll with Recent Views",
      userId: freeUser.id,
      touchedAt: dayjs().subtract(35, "day").toDate(),
      hasRecentViews: true,
    });
    createdPollIds.push(oldPollWithRecentViews.id);

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

    // We expect 2 polls to be marked as deleted:
    // - Old poll from free user (not in a paid space)
    // - Old poll without a user
    expect(responseData.summary.markedDeleted).toBe(2);

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

    const protectedPollWithRecentViews = await prisma.poll.findUnique({
      where: { id: oldPollWithRecentViews.id },
    });
    expect(protectedPollWithRecentViews?.deleted).toBe(false);
    expect(protectedPollWithRecentViews?.deletedAt).toBeNull();
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
});
