import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { Effect } from "effect";
import {
  releaseApiPollSlot,
  reserveApiPollSlot,
} from "@/features/api-keys/quota/mutations";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { createUserInDb } from "./test-utils";

// The public API cannot be reached here (its rate limiter fails closed
// without a KV store), so the reservation is exercised directly against the
// database. Each test uses its own month so they stay independent.

const runId = Date.now().toString(36);
let userId: string;
let spaceId: AuthorizedSpaceId;

test.beforeAll(async () => {
  const user = await createUserInDb({
    email: `api-usage-${runId}@example.com`,
    name: "API Usage",
  });
  userId = user.id;
  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  spaceId = space.id as AuthorizedSpaceId;
});

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: userId } });
});

function storedCount(period: Date) {
  return prisma.apiUsage
    .findUnique({
      where: {
        spaceId_resource_period: { spaceId, resource: "poll", period },
      },
      select: { count: true },
    })
    .then((row) => row?.count ?? null);
}

function reserve({ now, limit }: { now: Date; limit: number | null }) {
  return Effect.runPromise(reserveApiPollSlot({ spaceId, now, limit }));
}

function release(period: Date) {
  return Effect.runPromise(releaseApiPollSlot({ spaceId, period }));
}

test("concurrent reservations never exceed the limit", async () => {
  const now = new Date(Date.UTC(2030, 0, 15, 12));

  const results = await Promise.all(
    Array.from({ length: 20 }, () => reserve({ now, limit: 5 })),
  );

  expect(results.filter((result) => result.reserved)).toHaveLength(5);
  expect(await storedCount(new Date(Date.UTC(2030, 0, 1)))).toBe(5);
});

test("counts every reservation when there is no limit", async () => {
  const now = new Date(Date.UTC(2030, 1, 10));

  const results = await Promise.all(
    Array.from({ length: 20 }, () => reserve({ now, limit: null })),
  );

  expect(results.every((result) => result.reserved)).toBe(true);
  expect(await storedCount(new Date(Date.UTC(2030, 1, 1)))).toBe(20);
});

test("release never takes the count below zero", async () => {
  const now = new Date(Date.UTC(2030, 2, 20));
  const { period } = await reserve({ now, limit: null });

  await release(period);
  await release(period);

  expect(await storedCount(period)).toBe(0);
});

test("release without a row does nothing", async () => {
  const period = new Date(Date.UTC(2030, 3, 1));

  await release(period);

  expect(await storedCount(period)).toBeNull();
});

test("a new month starts a new row", async () => {
  const lastDay = new Date(Date.UTC(2030, 4, 31, 23, 59, 59));
  const firstDay = new Date(Date.UTC(2030, 5, 1));

  await reserve({ now: lastDay, limit: 1 });
  const next = await reserve({ now: firstDay, limit: 1 });

  expect(next).toEqual({
    reserved: true,
    period: new Date(Date.UTC(2030, 5, 1)),
    count: 1,
  });
  expect(await storedCount(new Date(Date.UTC(2030, 4, 1)))).toBe(1);
});
