import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { Effect } from "effect";
import {
  queueApiPollQuotaWarning,
  reserveApiPollSlot,
} from "@/features/api-keys/quota/mutations";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { createUserInDb } from "./test-utils";

// Exercised directly against the database, like the reservation itself.
// Each test uses its own month so the warned columns stay independent.

const runId = Date.now().toString(36);
const limit = 50;
let userId: string;
let spaceId: AuthorizedSpaceId;

test.beforeAll(async () => {
  const user = await createUserInDb({
    email: `api-quota-warning-${runId}@example.com`,
    name: "API Quota Warning",
  });
  userId = user.id;
  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });
  spaceId = space.id as AuthorizedSpaceId;
});

test.afterAll(async () => {
  await prisma.queuedEmail.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

async function reserveTo({ now, count }: { now: Date; count: number }) {
  let reached = 0;
  while (reached < count) {
    const result = await Effect.runPromise(
      reserveApiPollSlot({ spaceId, now, limit: null }),
    );
    if (!result.reserved) throw new Error("Expected a reservation");
    reached = result.count;
  }
}

function warn({ now, count }: { now: Date; count: number }) {
  return queueApiPollQuotaWarning({ spaceId, limit, count, now });
}

function queuedSubjects(month: string) {
  return prisma.queuedEmail
    .findMany({
      where: {
        kind: "api_poll_quota_warning",
        userId,
        subjectId: { startsWith: `${spaceId}:${month}:` },
      },
      orderBy: { createdAt: "asc" },
      select: { subjectId: true },
    })
    .then((rows) => rows.map((row) => row.subjectId));
}

test("crossing 80% queues one email to the owner", async () => {
  const now = new Date(Date.UTC(2031, 0, 10));
  await reserveTo({ now, count: 39 });
  await warn({ now, count: 39 });
  expect(await queuedSubjects("2031-01")).toEqual([]);

  await reserveTo({ now, count: 40 });
  await warn({ now, count: 40 });

  expect(await queuedSubjects("2031-01")).toEqual([
    `${spaceId}:2031-01:near_limit`,
  ]);
});

test("a second call past 80% queues none", async () => {
  const now = new Date(Date.UTC(2031, 1, 10));
  await reserveTo({ now, count: 40 });
  await warn({ now, count: 40 });
  await reserveTo({ now, count: 41 });
  await warn({ now, count: 41 });

  expect(await queuedSubjects("2031-02")).toEqual([
    `${spaceId}:2031-02:near_limit`,
  ]);
});

test("reaching the limit queues a second email", async () => {
  const now = new Date(Date.UTC(2031, 2, 10));
  await reserveTo({ now, count: 40 });
  await warn({ now, count: 40 });
  await reserveTo({ now, count: 50 });
  await warn({ now, count: 50 });
  await reserveTo({ now, count: 51 });
  await warn({ now, count: 51 });

  expect(await queuedSubjects("2031-03")).toEqual([
    `${spaceId}:2031-03:near_limit`,
    `${spaceId}:2031-03:at_limit`,
  ]);
});

test("the next month queues again", async () => {
  const lastDay = new Date(Date.UTC(2031, 3, 30, 23, 59, 59));
  const firstDay = new Date(Date.UTC(2031, 4, 1));
  await reserveTo({ now: lastDay, count: 40 });
  await warn({ now: lastDay, count: 40 });
  await reserveTo({ now: firstDay, count: 40 });
  await warn({ now: firstDay, count: 40 });

  expect(await queuedSubjects("2031-04")).toEqual([
    `${spaceId}:2031-04:near_limit`,
  ]);
  expect(await queuedSubjects("2031-05")).toEqual([
    `${spaceId}:2031-05:near_limit`,
  ]);
});

test("concurrent calls queue one email", async () => {
  const now = new Date(Date.UTC(2031, 5, 10));
  await reserveTo({ now, count: 40 });

  await Promise.all(Array.from({ length: 10 }, () => warn({ now, count: 40 })));

  expect(await queuedSubjects("2031-06")).toEqual([
    `${spaceId}:2031-06:near_limit`,
  ]);
});

test("reaching the limit covers the near limit warning", async () => {
  const now = new Date(Date.UTC(2031, 6, 10));
  await reserveTo({ now, count: 50 });
  await warn({ now, count: 50 });
  await warn({ now, count: 49 });

  expect(await queuedSubjects("2031-07")).toEqual([
    `${spaceId}:2031-07:at_limit`,
  ]);
});
