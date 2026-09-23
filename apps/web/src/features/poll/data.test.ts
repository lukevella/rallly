import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockOptionGroupBy = vi.fn();

vi.mock("@rallly/database", () => ({
  prisma: {
    poll: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    option: {
      groupBy: (...args: unknown[]) => mockOptionGroupBy(...args),
    },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  },
}));

import type { AuthorizedSpaceId } from "@/features/space/types";
import { getPolls, listPolls } from "./data";

const spaceId = "test-space-id" as AuthorizedSpaceId;

const makePoll = (id: string) => ({
  id,
  title: `Poll ${id}`,
  description: null,
  location: null,
  timeZone: null,
  status: "open",
  createdAt: new Date("2025-01-10T12:00:00Z"),
  user: null,
  options: [],
  _count: { participants: 2 },
});

describe("listPolls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all polls with a null nextCursor when there are no more pages", async () => {
    mockFindMany.mockResolvedValue([makePoll("p1"), makePoll("p2")]);

    const result = await listPolls({ spaceId, limit: 20 });

    expect(result.polls).toHaveLength(2);
    expect(result.polls[0]?.participantCount).toBe(2);
    expect(result.nextCursor).toBeNull();
  });

  it("slices to the limit and returns the last item's id as nextCursor", async () => {
    mockFindMany.mockResolvedValue([
      makePoll("p1"),
      makePoll("p2"),
      makePoll("p3"),
    ]);

    const result = await listPolls({ spaceId, limit: 2 });

    expect(result.polls).toHaveLength(2);
    expect(result.polls.map((poll) => poll.id)).toEqual(["p1", "p2"]);
    expect(result.nextCursor).toBe("p2");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("scopes the query to the space and excludes deleted polls", async () => {
    mockFindMany.mockResolvedValue([]);

    await listPolls({ spaceId, limit: 20 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { spaceId, deleted: false },
      }),
    );
  });

  it("applies the status filter when provided", async () => {
    mockFindMany.mockResolvedValue([]);

    await listPolls({ spaceId, status: "closed", limit: 20 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { spaceId, deleted: false, status: "closed" },
      }),
    );
  });

  it("resumes from the cursor when provided", async () => {
    mockFindMany.mockResolvedValue([]);

    await listPolls({ spaceId, cursor: "p2", limit: 20 });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "p2" },
        skip: 1,
      }),
    );
  });
});

describe("getPolls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeListedPoll = (id: string, participants: number) => ({
    id,
    title: `Poll ${id}`,
    status: "open",
    closedReason: null,
    timeZone: "Europe/London",
    createdAt: new Date("2025-01-10T12:00:00Z"),
    updatedAt: new Date("2025-01-11T12:00:00Z"),
    user: null,
    _count: { participants },
  });

  it("returns each poll's participant count and option date range", async () => {
    const start = new Date("2025-02-03T09:00:00Z");
    const end = new Date("2025-02-07T15:00:00Z");
    mockCount.mockResolvedValue(2);
    mockFindMany.mockResolvedValue([
      makeListedPoll("p1", 3),
      makeListedPoll("p2", 0),
    ]);
    mockOptionGroupBy.mockResolvedValue([
      { pollId: "p1", _min: { startTime: start }, _max: { startTime: end } },
    ]);

    const result = await getPolls({ scope: { spaceId } });

    expect(mockOptionGroupBy).toHaveBeenCalledWith({
      by: ["pollId"],
      where: { pollId: { in: ["p1", "p2"] } },
      _min: { startTime: true },
      _max: { startTime: true },
    });
    expect(result.polls[0]).toMatchObject({
      id: "p1",
      participantCount: 3,
      timeZone: "Europe/London",
      dateRange: { start, end },
    });
    // A poll with no options has no range to show
    expect(result.polls[1]).toMatchObject({
      id: "p2",
      participantCount: 0,
      dateRange: null,
    });
  });
});
