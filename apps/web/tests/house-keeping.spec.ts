import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";

/**
 * This test suite tests the house-keeping API endpoints:
 * 1. delete-inactive-polls: Marks inactive polls as deleted
 * 2. remove-deleted-polls: Permanently removes polls that have been marked as deleted for more than 30 days
 */
test.describe("House-keeping API", () => {
  // Store created poll IDs for cleanup
  const createdPollIds: string[] = [];
  const createdUserIds: string[] = [];

  // API Secret for authentication
  const API_SECRET = process.env.API_SECRET;

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

    const proUser = await prisma.user.create({
      data: {
        name: "Pro User",
        email: "pro-user@example.com",
        subscription: {
          create: {
            id: "sub_test_pro",
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
    createdUserIds.push(proUser.id);

    // Create test polls

    // 1. Old poll from regular user (should be marked as deleted)
    const oldPollRegularUser = await prisma.poll.create({
      data: {
        id: "old-poll-regular-user",
        title: "Old Poll Regular User",
        participantUrlId: "old-poll-regular-user-participant",
        adminUrlId: "old-poll-regular-user-admin",
        userId: regularUser.id,
        options: {
          create: [
            {
              startTime: dayjs().subtract(35, "day").toDate(), // 35 days in the past
              duration: 60,
            },
            {
              startTime: dayjs().subtract(40, "day").toDate(), // 40 days in the past
              duration: 60,
            },
          ],
        },
      },
    });
    createdPollIds.push(oldPollRegularUser.id);

    // 2. Old poll from pro user (should NOT be marked as deleted)
    const oldPollProUser = await prisma.poll.create({
      data: {
        id: "old-poll-pro-user",
        title: "Old Poll Pro User",
        participantUrlId: "old-poll-pro-user-participant",
        adminUrlId: "old-poll-pro-user-admin",
        userId: proUser.id,
        options: {
          create: [
            {
              startTime: dayjs().subtract(35, "day").toDate(), // 35 days in the past
              duration: 60,
            },
            {
              startTime: dayjs().subtract(40, "day").toDate(), // 40 days in the past
              duration: 60,
            },
          ],
        },
      },
    });
    createdPollIds.push(oldPollProUser.id);

    // 3. Old poll from guest user (should be marked as deleted)
    const oldPollGuestUser = await prisma.poll.create({
      data: {
        id: "old-poll-guest-user",
        title: "Old Poll Guest User",
        participantUrlId: "old-poll-guest-user-participant",
        adminUrlId: "old-poll-guest-user-admin",
        userId: null,
        guestId: "guest-1",
        options: {
          create: [
            {
              startTime: dayjs().subtract(35, "day").toDate(), // 35 days in the past
              duration: 60,
            },
            {
              startTime: dayjs().subtract(40, "day").toDate(), // 40 days in the past
              duration: 60,
            },
          ],
        },
      },
    });
    createdPollIds.push(oldPollGuestUser.id);

    // 4. Old poll with future options from regular user (should NOT be marked as deleted)
    const oldPollWithFutureOptions = await prisma.poll.create({
      data: {
        id: "old-poll-with-future-options",
        title: "Old Poll With Future Options",
        participantUrlId: "old-poll-with-future-options-participant",
        adminUrlId: "old-poll-with-future-options-admin",
        userId: regularUser.id,
        options: {
          create: {
            startTime: dayjs().add(10, "day").toDate(), // Future date
            duration: 60,
          },
        },
      },
    });
    createdPollIds.push(oldPollWithFutureOptions.id);

    // 4. Poll with some dates less than 30 days in the past (should NOT be marked as deleted)
    const pollWithRecentPastDates = await prisma.poll.create({
      data: {
        id: "poll-with-recent-past-dates",
        title: "Poll With Recent Past Dates",
        participantUrlId: "poll-with-recent-past-dates-participant",
        adminUrlId: "poll-with-recent-past-dates-admin",
        userId: regularUser.id,
        options: {
          create: [
            {
              startTime: dayjs().subtract(15, "day").toDate(), // 15 days in the past
              duration: 60,
            },
            {
              startTime: dayjs().subtract(35, "day").toDate(), // 35 days in the past
              duration: 60,
            },
          ],
        },
      },
    });
    createdPollIds.push(pollWithRecentPastDates.id);

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

    expect(responseData.summary.markedDeleted).toBe(2);

    // Verify the state of each poll
    const updatedOldPollRegularUser = await prisma.poll.findUnique({
      where: { id: oldPollRegularUser.id },
    });
    expect(updatedOldPollRegularUser?.deleted).toBe(true);
    expect(updatedOldPollRegularUser?.deletedAt).not.toBeNull();

    const updatedOldPollProUser = await prisma.poll.findUnique({
      where: { id: oldPollProUser.id },
    });
    expect(updatedOldPollProUser?.deleted).toBe(false);
    expect(updatedOldPollProUser?.deletedAt).toBeNull();

    const updatedOldPollWithFutureOptions = await prisma.poll.findUnique({
      where: { id: oldPollWithFutureOptions.id },
    });
    expect(updatedOldPollWithFutureOptions?.deleted).toBe(false);
    expect(updatedOldPollWithFutureOptions?.deletedAt).toBeNull();

    const updatedOldPollGuestUser = await prisma.poll.findUnique({
      where: { id: oldPollGuestUser.id },
    });
    expect(updatedOldPollGuestUser?.deleted).toBe(true);
    expect(updatedOldPollGuestUser?.deletedAt).not.toBeNull();

    const updatedPollWithRecentPastDates = await prisma.poll.findUnique({
      where: { id: pollWithRecentPastDates.id },
    });
    expect(updatedPollWithRecentPastDates?.deleted).toBe(false);
    expect(updatedPollWithRecentPastDates?.deletedAt).toBeNull();
  });

  test("should permanently remove polls that have been marked as deleted for more than 30 days", async ({
    request,
    baseURL,
  }) => {
    // Create a poll that was marked as deleted more than 30 days ago
    const oldDeletedPoll = await prisma.poll.create({
      data: {
        id: "old-deleted-poll",
        title: "Old Deleted Poll",
        participantUrlId: "old-deleted-poll-participant",
        adminUrlId: "old-deleted-poll-admin",
        deleted: true,
        deletedAt: dayjs().subtract(31, "day").toDate(), // Deleted 31 days ago
      },
    });
    createdPollIds.push(oldDeletedPoll.id);

    // Create a poll that was marked as deleted less than 30 days ago
    const recentDeletedPoll = await prisma.poll.create({
      data: {
        id: "recent-deleted-poll",
        title: "Recent Deleted Poll",
        participantUrlId: "recent-deleted-poll-participant",
        adminUrlId: "recent-deleted-poll-admin",
        deleted: true,
        deletedAt: dayjs().subtract(15, "day").toDate(), // Deleted 15 days ago
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
