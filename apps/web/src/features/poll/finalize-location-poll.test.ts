import { beforeEach, describe, expect, it, vi } from "vitest";

// The mutations schedule webhook dispatch, whose module validates the whole
// environment on import. Stub the env with nothing set.
vi.mock("@/env", () => ({ env: {} }));

import { finalizeLocationPoll } from "./mutations";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  pollFindFirst: vi.fn(),
  pollUpdate: vi.fn(),
  optionFindFirst: vi.fn(),
  activityCreateMany: vi.fn(),
}));

vi.mock("@rallly/database", () => {
  const client = {
    $queryRaw: mocks.queryRaw,
    poll: { findFirst: mocks.pollFindFirst, update: mocks.pollUpdate },
    option: { findFirst: mocks.optionFindFirst },
    pollActivity: { createMany: mocks.activityCreateMany },
  };
  return {
    prisma: {
      ...client,
      $transaction: (fn: (tx: typeof client) => unknown) => fn(client),
    },
  };
});

const input = { pollId: "poll-1", optionId: "option-1", userId: "user-1" };

describe("finalizeLocationPoll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pollFindFirst.mockResolvedValue({ kind: "location", status: "open" });
    mocks.optionFindFirst.mockResolvedValue({
      name: "Café du Centre",
      address: "12 rue de la Paix, Paris",
    });
  });

  it("makes the place the poll's location and closes it", async () => {
    await expect(finalizeLocationPoll(input)).resolves.toEqual({ ok: true });

    expect(mocks.pollUpdate).toHaveBeenCalledWith({
      where: { id: "poll-1" },
      data: {
        location: "Café du Centre, 12 rue de la Paix, Paris",
        status: "closed",
        closedReason: "manual",
      },
    });
  });

  it("uses the name alone when the place has no address", async () => {
    mocks.optionFindFirst.mockResolvedValue({
      name: "Le Bistrot",
      address: null,
    });

    await finalizeLocationPoll(input);

    expect(mocks.pollUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ location: "Le Bistrot" }),
      }),
    );
  });

  it("scopes the option to the poll", async () => {
    await finalizeLocationPoll(input);

    expect(mocks.optionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "option-1", pollId: "poll-1" } }),
    );
  });

  it("records the closing when the poll was open", async () => {
    await finalizeLocationPoll(input);

    expect(mocks.activityCreateMany).toHaveBeenCalledTimes(1);
    const { data } = mocks.activityCreateMany.mock.calls[0][0];
    expect(data).toEqual([
      expect.objectContaining({
        pollId: "poll-1",
        type: "poll_closed",
        userId: "user-1",
      }),
    ]);
  });

  it("changes the place of a closed poll without recording a second closing", async () => {
    mocks.pollFindFirst.mockResolvedValue({
      kind: "location",
      status: "closed",
    });

    await expect(finalizeLocationPoll(input)).resolves.toEqual({ ok: true });

    expect(mocks.pollUpdate).toHaveBeenCalled();
    expect(mocks.activityCreateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["the poll does not exist", null, "notFound"],
    [
      "the poll is a date poll",
      { kind: "date", status: "open" },
      "notLocationPoll",
    ],
    [
      "the poll was scheduled",
      { kind: "location", status: "finalized" },
      "notOpen",
    ],
  ])("refuses when %s", async (_label, poll, reason) => {
    mocks.pollFindFirst.mockResolvedValue(poll);

    await expect(finalizeLocationPoll(input)).resolves.toEqual({
      ok: false,
      reason,
    });
    expect(mocks.pollUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["is not one of the poll's options", null],
    ["has no name", { name: null, address: null }],
  ])("refuses when the option %s", async (_label, option) => {
    mocks.optionFindFirst.mockResolvedValue(option);

    await expect(finalizeLocationPoll(input)).resolves.toEqual({
      ok: false,
      reason: "optionNotFound",
    });
    expect(mocks.pollUpdate).not.toHaveBeenCalled();
    expect(mocks.activityCreateMany).not.toHaveBeenCalled();
  });
});
