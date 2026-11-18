import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));
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

const { tx } = vi.hoisted(() => ({
  tx: {
    $queryRaw: vi.fn(),
    option: { findMany: vi.fn() },
    participant: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    vote: { deleteMany: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock("@rallly/database", () => ({
  prisma: {
    poll: {
      findUnique: vi.fn().mockResolvedValue({ user: null, space: null }),
    },
    $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
  },
}));

import { addParticipant, updateParticipantVotes } from "./mutations";

const NOW = new Date("2026-06-10T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  tx.$queryRaw.mockResolvedValue([
    { status: "open", deleted: false, allow_tentative_votes: true },
  ]);
  tx.option.findMany.mockResolvedValue([
    { id: "past", startTime: new Date("2026-06-10T09:00:00Z"), duration: 60 },
    { id: "future", startTime: new Date("2026-06-11T09:00:00Z"), duration: 60 },
  ]);
  tx.participant.count.mockResolvedValue(0);
  tx.participant.create.mockResolvedValue({ id: "p1", name: "Anne", poll: {} });
  tx.participant.findFirst.mockResolvedValue({ id: "p1" });
  tx.participant.update.mockResolvedValue({ name: "Anne" });
});

const add = (votes: { optionId: string; type: "yes" | "no" | "ifNeedBe" }[]) =>
  addParticipant({
    pollId: "poll",
    userId: "u1",
    locale: "en",
    name: "Anne",
    votes,
  });

describe("addParticipant", () => {
  it("refuses an availability on a past option", async () => {
    const result = await add([
      { optionId: "past", type: "yes" },
      { optionId: "future", type: "yes" },
    ]);

    expect(result).toEqual({ ok: false, reason: "pastOption" });
    expect(tx.participant.create).not.toHaveBeenCalled();
  });

  it("accepts a no on a past option", async () => {
    const result = await add([
      { optionId: "past", type: "no" },
      { optionId: "future", type: "yes" },
    ]);

    expect(result.ok).toBe(true);
  });
});

describe("updateParticipantVotes", () => {
  it("keeps the stored votes on past options and changes only future ones", async () => {
    const result = await updateParticipantVotes({
      participantId: "p1",
      pollId: "poll",
      actorUserId: "u1",
      votes: [
        { optionId: "past", type: "yes" },
        { optionId: "future", type: "ifNeedBe" },
      ],
    });

    expect(result).toEqual({ ok: true });
    expect(tx.vote.deleteMany).toHaveBeenCalledWith({
      where: { participantId: "p1", optionId: { notIn: ["past"] } },
    });
    expect(tx.vote.createMany).toHaveBeenCalledWith({
      data: [
        {
          optionId: "future",
          type: "ifNeedBe",
          pollId: "poll",
          participantId: "p1",
        },
      ],
    });
  });
});
