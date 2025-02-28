import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";

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
  const API_SECRET = process.env.API_SECRET || "test-secret";

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

  test("should mark inactive polls as deleted for users without active subscriptions", async ({
    request,
    baseURL,
  }) => {
    // Create test users
    const regularUser = await prisma.user.create({
      data: {
        name: "Regular User",
        email: "regular-user@example.com",
      },
    });
    createdUserIds.push(regularUser.id);

    const premiumUser = await prisma.user.create({
      data: {
        name: "Premium User",
        email: "premium-user@example.com",
        subscription: {
          create: {
            id: "sub_test_premium",
            priceId: "price_test",
            amount: 1000,
            status: "active",
            active: true,
            currency: "USD",
            interval: "month",
            periodStart: new Date(),
            periodEnd: dayjs().add(30, "day").toDate(),
          },
        },
      },
    });
    createdUserIds.push(premiumUser.id);

    // Create test polls

    // 1. Old poll from regular user (should be marked as deleted)
    const oldPollRegularUser = await prisma.poll.create({
      data: {
        id: "old-poll-regular-user",
        title: "Old Poll Regular User",
        participantUrlId: "old-poll-regular-user-participant",
        adminUrlId: "old-poll-regular-user-admin",
        userId: regularUser.id,
        touchedAt: dayjs().subtract(35, "day").toDate(), // 35 days old
      },
    });
    createdPollIds.push(oldPollRegularUser.id);

    // 2. Old poll from premium user (should NOT be marked as deleted)
    const oldPollPremiumUser = await prisma.poll.create({
      data: {
        id: "old-poll-premium-user",
        title: "Old Poll Premium User",
        participantUrlId: "old-poll-premium-user-participant",
        adminUrlId: "old-poll-premium-user-admin",
        userId: premiumUser.id,
        touchedAt: dayjs().subtract(35, "day").toDate(), // 35 days old
      },
    });
    createdPollIds.push(oldPollPremiumUser.id);

    // 3. Recent poll from regular user (should NOT be marked as deleted)
    const recentPollRegularUser = await prisma.poll.create({
      data: {
        id: "recent-poll-regular-user",
        title: "Recent Poll Regular User",
        participantUrlId: "recent-poll-regular-user-participant",
        adminUrlId: "recent-poll-regular-user-admin",
        userId: regularUser.id,
        touchedAt: dayjs().subtract(15, "day").toDate(), // 15 days old
      },
    });
    createdPollIds.push(recentPollRegularUser.id);

    // 4. Old poll with future options from regular user (should NOT be marked as deleted)
    const oldPollWithFutureOptions = await prisma.poll.create({
      data: {
        id: "old-poll-with-future-options",
        title: "Old Poll With Future Options",
        participantUrlId: "old-poll-with-future-options-participant",
        adminUrlId: "old-poll-with-future-options-admin",
        userId: regularUser.id,
        touchedAt: dayjs().subtract(35, "day").toDate(), // 35 days old
        options: {
          create: {
            startTime: dayjs().add(10, "day").toDate(), // Future date
            duration: 60,
          },
        },
      },
    });
    createdPollIds.push(oldPollWithFutureOptions.id);

    // 5. Old poll without a user (should be marked as deleted)
    const oldPollNoUser = await prisma.poll.create({
      data: {
        id: "old-poll-no-user",
        title: "Old Poll No User",
        participantUrlId: "old-poll-no-user-participant",
        adminUrlId: "old-poll-no-user-admin",
        touchedAt: dayjs().subtract(35, "day").toDate(), // 35 days old
      },
    });
    createdPollIds.push(oldPollNoUser.id);

    // Call the delete-inactive-polls endpoint
    const response = await request.post(
      `${baseURL}/api/house-keeping/delete-inactive-polls`,
      {
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
        },
      },
    );

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    expect(responseData.success).toBeTruthy();

    // We expect 2 polls to be marked as deleted:
    // - Old poll from regular user
    // - Old poll without a user
    expect(responseData.summary.markedDeleted).toBe(2);

    // Verify the state of each poll
    const updatedOldPollRegularUser = await prisma.poll.findUnique({
      where: { id: oldPollRegularUser.id },
    });
    expect(updatedOldPollRegularUser?.deleted).toBe(true);
    expect(updatedOldPollRegularUser?.deletedAt).not.toBeNull();

    const updatedOldPollPremiumUser = await prisma.poll.findUnique({
      where: { id: oldPollPremiumUser.id },
    });
    expect(updatedOldPollPremiumUser?.deleted).toBe(false);
    expect(updatedOldPollPremiumUser?.deletedAt).toBeNull();

    const updatedRecentPollRegularUser = await prisma.poll.findUnique({
      where: { id: recentPollRegularUser.id },
    });
    expect(updatedRecentPollRegularUser?.deleted).toBe(false);
    expect(updatedRecentPollRegularUser?.deletedAt).toBeNull();

    const updatedOldPollWithFutureOptions = await prisma.poll.findUnique({
      where: { id: oldPollWithFutureOptions.id },
    });
    expect(updatedOldPollWithFutureOptions?.deleted).toBe(false);
    expect(updatedOldPollWithFutureOptions?.deletedAt).toBeNull();

    const updatedOldPollNoUser = await prisma.poll.findUnique({
      where: { id: oldPollNoUser.id },
    });
    expect(updatedOldPollNoUser?.deleted).toBe(true);
    expect(updatedOldPollNoUser?.deletedAt).not.toBeNull();
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
    const response = await request.post(
      `${baseURL}/api/house-keeping/remove-deleted-polls`,
      {
        headers: {
          Authorization: `Bearer ${API_SECRET}`,
        },
        data: {}, // Empty JSON body
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
