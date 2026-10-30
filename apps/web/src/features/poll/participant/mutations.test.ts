import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  queryRaw: vi.fn(),
  participantFindFirst: vi.fn(),
  optionFindMany: vi.fn(),
  participantCount: vi.fn(),
  participantCreate: vi.fn(),
  voteDeleteMany: vi.fn(),
  voteCreateMany: vi.fn(),
  voteGroupBy: vi.fn(),
  participantUpdate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env: {} }));
vi.mock("@rallly/database", () => ({
  prisma: {
    poll: { findUnique: mocks.findUnique },
    $transaction: (fn: (tx: object) => unknown) =>
      fn({
        $queryRaw: mocks.queryRaw,
        participant: {
          findFirst: mocks.participantFindFirst,
          count: mocks.participantCount,
          create: mocks.participantCreate,
          update: mocks.participantUpdate,
        },
        option: { findMany: mocks.optionFindMany },
        vote: {
          deleteMany: mocks.voteDeleteMany,
          createMany: mocks.voteCreateMany,
          groupBy: mocks.voteGroupBy,
        },
      }),
  },
}));
vi.mock("@/features/activity/mutations", () => ({
  recordPollActivities: vi.fn(),
}));
vi.mock("@/features/poll/invite/mutations", () => ({
  attachParticipantToInvite: vi.fn(),
  findPendingPollInvite: vi.fn(),
}));
vi.mock("@/features/poll/mutations", () => ({
  revalidatePollPages: vi.fn(),
}));
vi.mock("@/features/webhook/mutations", () => ({
  scheduleWebhookDispatch: vi.fn(),
}));

import { addParticipant, updateParticipantVotes } from "./mutations";

const NOW = new Date("2026-10-29T12:00:00Z");
const pastOption = {
  id: "option-past",
  startTime: new Date("2026-10-28T00:00:00Z"),
  duration: 0,
};
const startedOption = {
  id: "option-started",
  startTime: new Date("2026-10-29T11:30:00Z"),
  duration: 120,
};

describe("participant vote mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mocks.findUnique.mockResolvedValue({
      user: { banned: false },
      space: null,
    });
    mocks.queryRaw.mockResolvedValue([
      {
        status: "open",
        deleted: false,
        allow_tentative_votes: true,
        kind: "date",
      },
    ]);
    mocks.optionFindMany.mockResolvedValue([pastOption]);
    mocks.voteGroupBy.mockResolvedValue([]);
    mocks.participantCount.mockResolvedValue(0);
    mocks.participantFindFirst.mockResolvedValue({
      id: "participant-1",
      timeZone: "UTC",
      votes: [],
    });
  });

  it("rejects a new response voting yes for a past option", async () => {
    const result = await addParticipant({
      pollId: "poll-1",
      userId: "user-1",
      locale: "en",
      name: "Participant",
      timeZone: "UTC",
      votes: [{ optionId: pastOption.id, type: "yes" }],
    });

    expect(result).toEqual({ ok: false, reason: "optionPassed" });
    expect(mocks.participantCreate).not.toHaveBeenCalled();
  });

  it("rejects a new response voting yes after a time option starts", async () => {
    mocks.optionFindMany.mockResolvedValue([startedOption]);

    const result = await addParticipant({
      pollId: "poll-1",
      userId: "user-1",
      locale: "en",
      name: "Participant",
      timeZone: "UTC",
      votes: [{ optionId: startedOption.id, type: "yes" }],
    });

    expect(result).toEqual({ ok: false, reason: "optionPassed" });
    expect(mocks.participantCreate).not.toHaveBeenCalled();
  });

  it("rejects adding a new past vote while editing a response", async () => {
    const result = await updateParticipantVotes({
      participantId: "participant-1",
      pollId: "poll-1",
      actorUserId: "user-1",
      votes: [{ optionId: pastOption.id, type: "yes" }],
    });

    expect(result).toEqual({ ok: false, reason: "optionPassed" });
    expect(mocks.voteDeleteMany).not.toHaveBeenCalled();
  });

  it("rejects changing a past vote from yes to ifNeedBe", async () => {
    mocks.participantFindFirst.mockResolvedValue({
      id: "participant-1",
      timeZone: "UTC",
      votes: [{ optionId: pastOption.id, type: "yes" }],
    });

    const result = await updateParticipantVotes({
      participantId: "participant-1",
      pollId: "poll-1",
      actorUserId: "user-1",
      votes: [{ optionId: pastOption.id, type: "ifNeedBe" }],
    });

    expect(result).toEqual({ ok: false, reason: "optionPassed" });
    expect(mocks.voteDeleteMany).not.toHaveBeenCalled();
  });

  it("allows an unchanged historical vote while editing", async () => {
    mocks.participantFindFirst.mockResolvedValue({
      id: "participant-1",
      timeZone: "UTC",
      votes: [{ optionId: pastOption.id, type: "yes" }],
    });
    mocks.participantUpdate.mockResolvedValue({ name: "Participant" });

    const result = await updateParticipantVotes({
      participantId: "participant-1",
      pollId: "poll-1",
      actorUserId: "user-1",
      votes: [{ optionId: pastOption.id, type: "yes" }],
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.voteCreateMany).toHaveBeenCalledWith({
      data: [
        {
          optionId: pastOption.id,
          type: "yes",
          pollId: "poll-1",
          participantId: "participant-1",
        },
      ],
    });
  });

  it("allows removing a historical vote", async () => {
    mocks.participantFindFirst.mockResolvedValue({
      id: "participant-1",
      timeZone: "UTC",
      votes: [{ optionId: pastOption.id, type: "yes" }],
    });
    mocks.participantUpdate.mockResolvedValue({ name: "Participant" });

    const result = await updateParticipantVotes({
      participantId: "participant-1",
      pollId: "poll-1",
      actorUserId: "user-1",
      votes: [{ optionId: pastOption.id, type: "no" }],
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.voteCreateMany).toHaveBeenCalledWith({
      data: [
        {
          optionId: pastOption.id,
          type: "no",
          pollId: "poll-1",
          participantId: "participant-1",
        },
      ],
    });
  });
});
