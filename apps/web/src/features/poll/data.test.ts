import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockOptionGroupBy = vi.fn();
const mockParticipantGroupBy = vi.fn();
const mockPollFindFirst = vi.fn();
const mockParticipantFindMany = vi.fn();
const mockParticipantFindFirst = vi.fn();

vi.mock("@rallly/database", () => ({
  prisma: {
    poll: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      findFirst: (...args: unknown[]) => mockPollFindFirst(...args),
    },
    option: {
      groupBy: (...args: unknown[]) => mockOptionGroupBy(...args),
    },
    participant: {
      groupBy: (...args: unknown[]) => mockParticipantGroupBy(...args),
      findMany: (...args: unknown[]) => mockParticipantFindMany(...args),
      findFirst: (...args: unknown[]) => mockParticipantFindFirst(...args),
    },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  },
}));

import type { AuthorizedSpaceId } from "@/features/space/types";
import {
  getPollParticipant,
  getPollParticipants,
  getPolls,
  listPollParticipants,
  listPolls,
} from "./data";

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

  const makeListedPoll = (id: string) => ({
    id,
    title: `Poll ${id}`,
    status: "open",
    closedReason: null,
    timeZone: "Europe/London",
    createdAt: new Date("2025-01-10T12:00:00Z"),
    updatedAt: new Date("2025-01-11T12:00:00Z"),
    user: null,
  });

  it("returns each poll's participant count and option date range", async () => {
    const start = new Date("2025-02-03T09:00:00Z");
    const end = new Date("2025-02-07T15:00:00Z");
    mockCount.mockResolvedValue(2);
    mockFindMany.mockResolvedValue([
      makeListedPoll("p1"),
      makeListedPoll("p2"),
    ]);
    mockOptionGroupBy.mockResolvedValue([
      { pollId: "p1", _min: { startTime: start }, _max: { startTime: end } },
    ]);
    // A poll with no participants has no group
    mockParticipantGroupBy.mockResolvedValue([
      { pollId: "p1", _count: { _all: 3 } },
    ]);

    const result = await getPolls({ scope: { spaceId } });

    expect(mockOptionGroupBy).toHaveBeenCalledWith({
      by: ["pollId"],
      where: { pollId: { in: ["p1", "p2"] } },
      _min: { startTime: true },
      _max: { startTime: true },
    });
    expect(mockParticipantGroupBy).toHaveBeenCalledWith({
      by: ["pollId"],
      where: { pollId: { in: ["p1", "p2"] } },
      _count: { _all: true },
    });
    expect(mockFindMany.mock.calls[0]?.[0].select).not.toHaveProperty("_count");
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

// The aggregate flag can flip between the poll read and the participant
// read, so each participant read re-checks it in its own where clause: the
// database then evaluates the flag and the rows in one statement.
describe("participant reads of aggregate results polls", () => {
  const visible = { poll: { aggregateResultsOnly: false } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParticipantFindMany.mockResolvedValue([]);
    mockParticipantFindFirst.mockResolvedValue(null);
  });

  it("getPollParticipants re-checks the flag in the participant query", async () => {
    mockPollFindFirst.mockResolvedValue({
      id: "poll-1",
      kind: "date",
      aggregateResultsOnly: false,
    });

    await getPollParticipants({ pollId: "poll-1", spaceId });

    expect(mockParticipantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pollId: "poll-1", ...visible },
      }),
    );
  });

  it("getPollParticipants reads no participants once the poll is aggregate", async () => {
    mockPollFindFirst.mockResolvedValue({
      id: "poll-1",
      kind: "date",
      aggregateResultsOnly: true,
    });

    const result = await getPollParticipants({ pollId: "poll-1", spaceId });

    expect(result?.participants).toEqual([]);
    expect(mockParticipantFindMany).not.toHaveBeenCalled();
  });

  it("getPollParticipant re-checks the flag in the participant query", async () => {
    mockPollFindFirst.mockResolvedValue({
      id: "poll-1",
      kind: "date",
      aggregateResultsOnly: false,
    });

    await getPollParticipant({
      pollId: "poll-1",
      participantId: "participant-1",
      spaceId,
    });

    expect(mockParticipantFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pollId: "poll-1", id: "participant-1", ...visible },
      }),
    );
  });

  it("listPollParticipants admits only the viewer's own responses on aggregate polls", async () => {
    await listPollParticipants({
      pollId: "poll-1",
      viewer: { userId: "user-1", participantIds: ["participant-1"] },
    });

    expect(mockParticipantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pollId: "poll-1",
          OR: [
            visible,
            { userId: "user-1" },
            { id: { in: ["participant-1"] } },
          ],
        }),
      }),
    );
  });
});
