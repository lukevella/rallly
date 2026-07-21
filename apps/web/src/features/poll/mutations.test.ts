import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteInactivePolls } from "./mutations";

const { mockUpdateMany } = vi.hoisted(() => ({ mockUpdateMany: vi.fn() }));

vi.mock("@rallly/database", () => ({
  prisma: {
    poll: {
      updateMany: mockUpdateMany,
    },
  },
}));

const NOW = new Date("2026-07-21T12:00:00Z");

const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

type DeleteWhere = {
  deleted: boolean;
  options: { none: { startTime: { gt: Date } } };
  OR: [{ spaceId: null }, { space: { tier: { not: string } } }];
  updatedAt: { lt: Date };
  participants: { none: { updatedAt: { gte: Date } } };
  comments: { none: { createdAt: { gte: Date } } };
};

async function capturedWhere() {
  await deleteInactivePolls();
  const args = mockUpdateMany.mock.calls[0][0] as { where: DeleteWhere };
  return args.where;
}

/**
 * Evaluates the query's where clause against a poll the way Prisma would,
 * so the tests exercise the retention rule rather than the query's shape.
 */
function wouldDelete(
  where: DeleteWhere,
  poll: {
    optionStartTimes: Date[];
    spaceTier: "hobby" | "pro" | null;
    updatedAt: Date;
    participantUpdatedAts?: Date[];
    commentCreatedAts?: Date[];
  },
) {
  if (poll.optionStartTimes.some((t) => t > where.options.none.startTime.gt)) {
    return false;
  }
  if (poll.spaceTier === where.OR[1].space.tier.not) {
    return false;
  }
  if (!(poll.updatedAt < where.updatedAt.lt)) {
    return false;
  }
  if (
    (poll.participantUpdatedAts ?? []).some(
      (t) => t >= where.participants.none.updatedAt.gte,
    )
  ) {
    return false;
  }
  if (
    (poll.commentCreatedAts ?? []).some(
      (t) => t >= where.comments.none.createdAt.gte,
    )
  ) {
    return false;
  }
  return true;
}

describe("deleteInactivePolls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mockUpdateMany.mockResolvedValue({ count: 0 });
    return () => vi.useRealTimers();
  });

  it("keeps a poll whose dates passed less than 30 days ago even with no activity for 30+ days", async () => {
    const where = await capturedWhere();
    expect(
      wouldDelete(where, {
        optionStartTimes: [daysAgo(45), daysAgo(15)],
        spaceTier: "hobby",
        updatedAt: daysAgo(60),
      }),
    ).toBe(false);
  });

  it("deletes a poll whose dates passed more than 30 days ago with no activity for 30+ days on a non pro space", async () => {
    const where = await capturedWhere();
    expect(
      wouldDelete(where, {
        optionStartTimes: [daysAgo(45), daysAgo(31)],
        spaceTier: "hobby",
        updatedAt: daysAgo(31),
      }),
    ).toBe(true);
  });

  it("keeps a poll with recent participant or comment activity even if all dates passed more than 30 days ago", async () => {
    const where = await capturedWhere();
    expect(
      wouldDelete(where, {
        optionStartTimes: [daysAgo(45)],
        spaceTier: "hobby",
        updatedAt: daysAgo(60),
        participantUpdatedAts: [daysAgo(5)],
      }),
    ).toBe(false);
    expect(
      wouldDelete(where, {
        optionStartTimes: [daysAgo(45)],
        spaceTier: "hobby",
        updatedAt: daysAgo(60),
        commentCreatedAts: [daysAgo(5)],
      }),
    ).toBe(false);
  });

  it("keeps polls on pro spaces", async () => {
    const where = await capturedWhere();
    expect(
      wouldDelete(where, {
        optionStartTimes: [daysAgo(45)],
        spaceTier: "pro",
        updatedAt: daysAgo(60),
      }),
    ).toBe(false);
  });

  it("marks matching polls as deleted with a deletion timestamp", async () => {
    await deleteInactivePolls();
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deleted: true, deletedAt: NOW },
      }),
    );
  });
});
