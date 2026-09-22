import { describe, expect, it } from "vitest";
import { parsePollActivity, pollActivitySchema } from "./schema";

const emptyRefs = {
  userId: null,
  participantId: null,
  inviteId: null,
  optionId: null,
};

describe("pollActivitySchema", () => {
  it("accepts a system event with no actor", () => {
    const result = pollActivitySchema.safeParse({
      type: "poll_closed",
      userId: null,
      payload: { reason: "auto" },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown closed reason", () => {
    const result = pollActivitySchema.safeParse({
      type: "poll_closed",
      userId: "u1",
      payload: { reason: "deadline" },
    });

    expect(result.success).toBe(false);
  });

  it("requires the subject ref of a response event", () => {
    const result = pollActivitySchema.safeParse({
      type: "response_created",
      userId: "u1",
      payload: { name: "Jessie Smith" },
    });

    expect(result.success).toBe(false);
  });

  it("requires the vote snapshot on response_deleted", () => {
    const result = pollActivitySchema.safeParse({
      type: "response_deleted",
      userId: "u1",
      participantId: "part1",
      payload: { name: "Jessie Smith" },
    });

    expect(result.success).toBe(false);
  });
});

describe("parsePollActivity", () => {
  it("rehydrates a stored row into a typed event", () => {
    const event = parsePollActivity({
      ...emptyRefs,
      type: "response_deleted",
      userId: "u1",
      participantId: "part1",
      payload: {
        name: "Jessie Smith",
        votes: [
          {
            optionId: "opt1",
            start: "2026-09-01T10:00:00.000Z",
            duration: 60,
            type: "yes",
          },
        ],
      },
    });

    expect(event).toMatchObject({
      type: "response_deleted",
      participantId: "part1",
      payload: { name: "Jessie Smith" },
    });
  });

  it("returns null for a type outside this version's vocabulary", () => {
    const event = parsePollActivity({
      ...emptyRefs,
      type: "poll_broadcast",
      payload: {},
    });

    expect(event).toBeNull();
  });

  it("returns null when a required subject ref was lost", () => {
    const event = parsePollActivity({
      ...emptyRefs,
      type: "option_added",
      userId: "u1",
      payload: { start: "2026-09-01T10:00:00.000Z", duration: 60 },
    });

    expect(event).toBeNull();
  });
});
