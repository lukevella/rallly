import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  option: { findMany: vi.fn() },
  participant: {
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  vote: {
    groupBy: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

const findPoll = vi.hoisted(() => vi.fn());

vi.mock("@rallly/database", () => ({
  prisma: {
    poll: { findUnique: findPoll },
    $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
  },
}));

vi.mock("@/features/activity/mutations", () => ({
  recordPollActivities: vi.fn(),
}));

vi.mock("@/features/poll/invite/mutations", () => ({
  findPendingPollInvite: vi.fn(async () => null),
  attachParticipantToInvite: vi.fn(),
}));

vi.mock("@/features/poll/mutations", () => ({
  revalidatePollPages: vi.fn(),
}));

vi.mock("@/features/webhook/mutations", () => ({
  scheduleWebhookDispatch: vi.fn(),
}));

import { addParticipant, updateParticipantVotes } from "./mutations";

function openPoll(maxYesVotesPerOption: number | null) {
  tx.$queryRaw.mockResolvedValue([
    {
      status: "open",
      deleted: false,
      allow_tentative_votes: true,
      max_yes_votes_per_option: maxYesVotesPerOption,
    },
  ]);
}

function storedYesVotes(counts: Record<string, number>) {
  tx.vote.groupBy.mockResolvedValue(
    Object.entries(counts).map(([optionId, all]) => ({
      optionId,
      _count: { _all: all },
    })),
  );
}

const editVotes = (votes: { optionId: string; type: "yes" | "ifNeedBe" }[]) =>
  updateParticipantVotes({
    participantId: "anne",
    pollId: "p1",
    actorUserId: undefined,
    votes,
  });

beforeEach(() => {
  vi.clearAllMocks();
  tx.option.findMany.mockResolvedValue([{ id: "o1" }, { id: "o2" }]);
  tx.participant.findFirst.mockResolvedValue({ id: "anne" });
  tx.participant.update.mockResolvedValue({ name: "Anne" });
  storedYesVotes({});
});

describe("updateParticipantVotes with a place limit", () => {
  it("does not count votes when the poll has no limit", async () => {
    openPoll(null);
    expect(await editVotes([{ optionId: "o1", type: "yes" }])).toEqual({
      ok: true,
    });
    expect(tx.vote.groupBy).not.toHaveBeenCalled();
    expect(tx.vote.createMany).toHaveBeenCalled();
  });

  it("accepts a yes on an option that has room", async () => {
    openPoll(2);
    storedYesVotes({ o1: 1 });
    expect(await editVotes([{ optionId: "o1", type: "yes" }])).toEqual({
      ok: true,
    });
    expect(tx.vote.createMany).toHaveBeenCalled();
  });

  it("refuses a yes on a full option and keeps the stored votes", async () => {
    openPoll(2);
    storedYesVotes({ o1: 2 });
    expect(await editVotes([{ optionId: "o1", type: "yes" }])).toEqual({
      ok: false,
      reason: "optionFull",
    });
    expect(tx.vote.createMany).not.toHaveBeenCalled();
  });

  it("counts after deleting the participant's previous votes", async () => {
    openPoll(1);
    await editVotes([{ optionId: "o1", type: "yes" }]);
    expect(tx.vote.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.vote.groupBy.mock.invocationCallOrder[0],
    );
  });

  it("does not count if need be votes against the limit", async () => {
    openPoll(1);
    storedYesVotes({ o1: 1 });
    expect(await editVotes([{ optionId: "o1", type: "ifNeedBe" }])).toEqual({
      ok: true,
    });
    expect(tx.vote.groupBy).not.toHaveBeenCalled();
  });

  it("counts a repeated option once per repeat", async () => {
    openPoll(2);
    storedYesVotes({ o1: 1 });
    expect(
      await editVotes([
        { optionId: "o1", type: "yes" },
        { optionId: "o1", type: "yes" },
      ]),
    ).toEqual({ ok: false, reason: "optionFull" });
  });

  it("ignores votes for options that are not in the poll", async () => {
    openPoll(1);
    await editVotes([{ optionId: "other", type: "yes" }]);
    expect(tx.vote.groupBy).not.toHaveBeenCalled();
  });
});

describe("addParticipant with a place limit", () => {
  const respond = () =>
    addParticipant({
      pollId: "p1",
      userId: "u1",
      locale: "en",
      name: "Ben",
      votes: [{ optionId: "o1", type: "yes" }],
    });

  beforeEach(() => {
    findPoll.mockResolvedValue({ user: { banned: false }, space: null });
    tx.participant.count.mockResolvedValue(1);
    tx.participant.create.mockResolvedValue({
      id: "ben",
      name: "Ben",
      email: null,
      note: null,
      poll: {
        id: "p1",
        userId: "owner",
        title: "Workshop",
        allowTentativeVotes: true,
        space: null,
      },
    });
  });

  it("refuses a new response whose yes lands on a full option", async () => {
    openPoll(1);
    storedYesVotes({ o1: 1 });
    expect(await respond()).toEqual({ ok: false, reason: "optionFull" });
    expect(tx.participant.create).not.toHaveBeenCalled();
  });

  it("accepts a new response while the option has room", async () => {
    openPoll(2);
    storedYesVotes({ o1: 1 });
    expect(await respond()).toMatchObject({ ok: true });
    expect(tx.participant.create).toHaveBeenCalled();
  });
});
