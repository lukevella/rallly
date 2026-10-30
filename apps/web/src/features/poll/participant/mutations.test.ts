import { beforeEach, describe, expect, it, vi } from "vitest";

// Votes on options that are over are frozen on the server.

vi.mock("@/features/activity/mutations", () => ({
  recordPollActivities: vi.fn(),
}));
vi.mock("@/features/poll/mutations", () => ({
  revalidatePollPages: vi.fn(),
}));
vi.mock("@/features/webhook/mutations", () => ({
  scheduleWebhookDispatch: vi.fn(),
}));
vi.mock("@/features/poll/invite/mutations", () => ({
  findPendingPollInvite: vi.fn(),
  attachParticipantToInvite: vi.fn(),
}));

import { addParticipant, updateParticipantVotes } from "./mutations";

const NOW = new Date("2026-10-29T12:00:00Z");

// A zoned time poll: yesterday's slot is over, tomorrow's is not.
const PAST = {
  id: "past",
  startTime: new Date("2026-10-28T10:00:00Z"),
  duration: 60,
};
const FUTURE = {
  id: "future",
  startTime: new Date("2026-10-30T10:00:00Z"),
  duration: 60,
};

const db = vi.hoisted(() => ({
  options: [] as { id: string; startTime: Date; duration: number }[],
  storedVotes: [] as { optionId: string; type: string }[],
  createdVotes: [] as unknown[],
}));

vi.mock("@rallly/database", () => {
  const client = {
    $queryRaw: vi.fn(async () => [
      { status: "open", deleted: false, allow_tentative_votes: true },
    ]),
    poll: {
      findUnique: vi.fn(async () => ({
        user: null,
        space: null,
        timeZone: "Europe/Paris",
        options: db.options,
      })),
    },
    option: {
      findMany: vi.fn(async () => db.options.map(({ id }) => ({ id }))),
    },
    participant: {
      count: vi.fn(async () => 0),
      findFirst: vi.fn(async () => ({ id: "p1" })),
      create: vi.fn(async ({ data }) => {
        db.createdVotes = data.votes.createMany.data;
        return {
          id: "p1",
          name: data.name,
          email: null,
          note: null,
          poll: {
            id: "poll",
            title: "Poll",
            allowTentativeVotes: true,
            space: null,
          },
        };
      }),
      update: vi.fn(async () => ({ name: "Alice" })),
    },
    vote: {
      findMany: vi.fn(async ({ where }) =>
        db.storedVotes.filter((vote) =>
          where.optionId.in.includes(vote.optionId),
        ),
      ),
      deleteMany: vi.fn(),
      createMany: vi.fn(async ({ data }) => {
        db.createdVotes = data;
      }),
    },
  };
  return {
    prisma: {
      ...client,
      $transaction: (fn: (tx: typeof client) => unknown) => fn(client),
    },
  };
});

const add = (votes: { optionId: string; type: "yes" | "no" | "ifNeedBe" }[]) =>
  addParticipant({
    pollId: "poll",
    userId: "u1",
    locale: "fr",
    name: "Alice",
    votes,
  });

const update = (
  votes: { optionId: string; type: "yes" | "no" | "ifNeedBe" }[],
) =>
  updateParticipantVotes({
    participantId: "p1",
    pollId: "poll",
    actorUserId: "u1",
    votes,
  });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  db.options = [PAST, FUTURE];
  db.storedVotes = [];
  db.createdVotes = [];
});

describe("addParticipant", () => {
  it("refuses a yes on an option that is over", async () => {
    const result = await add([
      { optionId: "past", type: "yes" },
      { optionId: "future", type: "yes" },
    ]);
    expect(result).toEqual({ ok: false, reason: "pastOption" });
  });

  it("accepts a response that leaves past options at no", async () => {
    const result = await add([
      { optionId: "past", type: "no" },
      { optionId: "future", type: "yes" },
    ]);
    expect(result.ok).toBe(true);
    expect(db.createdVotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ optionId: "future", type: "yes" }),
        expect.objectContaining({ optionId: "past", type: "no" }),
      ]),
    );
    expect(db.createdVotes).toHaveLength(2);
  });

  it("accepts a decline when a single option is left", async () => {
    const result = await add([
      { optionId: "past", type: "no" },
      { optionId: "future", type: "no" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("refuses any new response once every option is over", async () => {
    db.options = [PAST];
    const result = await add([{ optionId: "past", type: "no" }]);
    expect(result).toEqual({ ok: false, reason: "pastOption" });
  });
});

describe("updateParticipantVotes", () => {
  it("refuses a change to the vote on an option that is over", async () => {
    db.storedVotes = [{ optionId: "past", type: "yes" }];
    const result = await update([
      { optionId: "past", type: "no" },
      { optionId: "future", type: "yes" },
    ]);
    expect(result).toEqual({ ok: false, reason: "pastOption" });
  });

  it("keeps the stored vote on a past option while the rest changes", async () => {
    db.storedVotes = [
      { optionId: "past", type: "ifNeedBe" },
      { optionId: "future", type: "no" },
    ];
    const result = await update([
      { optionId: "past", type: "ifNeedBe" },
      { optionId: "future", type: "yes" },
    ]);
    expect(result).toEqual({ ok: true });
    expect(db.createdVotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ optionId: "past", type: "ifNeedBe" }),
        expect.objectContaining({ optionId: "future", type: "yes" }),
      ]),
    );
    expect(db.createdVotes).toHaveLength(2);
  });

  it("changes nothing on polls without past options", async () => {
    db.options = [FUTURE];
    const result = await update([{ optionId: "future", type: "yes" }]);
    expect(result).toEqual({ ok: true });
  });
});
