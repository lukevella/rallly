import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@rallly/database", () => ({
  prisma: { poll: { findUnique: mocks.findUnique } },
}));

import { getBallotSource } from "./data";

const poll = (overrides: Record<string, unknown>) => ({
  id: "poll-1",
  kind: "time",
  status: "open",
  timeZone: "UTC",
  hideParticipants: false,
  hideScores: false,
  allowTentativeVotes: true,
  requireParticipantEmail: false,
  deleted: false,
  options: [],
  participants: [],
  ...overrides,
});

describe("getBallotSource", () => {
  beforeEach(() => vi.clearAllMocks());

  it("has no ballot for a poll that does not exist", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(getBallotSource({ pollId: "x" })).resolves.toBeNull();
  });

  it("has no ballot for a deleted poll", async () => {
    mocks.findUnique.mockResolvedValue(poll({ deleted: true }));
    await expect(getBallotSource({ pollId: "poll-1" })).resolves.toBeNull();
  });

  it("has no email ballot for a location poll", async () => {
    mocks.findUnique.mockResolvedValue(poll({ kind: "location" }));
    await expect(getBallotSource({ pollId: "poll-1" })).resolves.toBeNull();
  });

  it("builds the ballot of a date poll", async () => {
    mocks.findUnique.mockResolvedValue(poll({ kind: "date" }));
    await expect(getBallotSource({ pollId: "poll-1" })).resolves.toMatchObject({
      pollId: "poll-1",
      status: "open",
    });
  });
});
