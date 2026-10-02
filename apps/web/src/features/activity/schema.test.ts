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

  it("reads a response note when present and tolerates rows without one", () => {
    const withNote = parsePollActivity({
      ...emptyRefs,
      type: "response_created",
      participantId: "p1",
      payload: { name: "Jessie Smith", note: "Mornings work best" },
    });
    const withoutNote = parsePollActivity({
      ...emptyRefs,
      type: "response_created",
      participantId: "p1",
      payload: { name: "Jessie Smith" },
    });

    expect(withNote?.payload).toEqual({
      name: "Jessie Smith",
      note: "Mornings work best",
    });
    expect(withoutNote?.payload).toEqual({ name: "Jessie Smith" });
  });

  it("reads a batch of added dates as one event", () => {
    const event = parsePollActivity({
      ...emptyRefs,
      type: "options_added",
      payload: {
        options: [
          { optionId: "o1", start: "2026-10-11T00:00:00.000Z", duration: 0 },
          { optionId: "o2", start: "2026-10-12T00:00:00.000Z", duration: 0 },
        ],
      },
    });

    expect(event?.type).toBe("options_added");
  });

  it("rejects an empty batch of dates", () => {
    const result = pollActivitySchema.safeParse({
      type: "options_deleted",
      userId: "u1",
      payload: { options: [] },
    });

    expect(result.success).toBe(false);
  });

  it("reads a poll scheduled for a time that isn't one of its options", () => {
    const event = parsePollActivity({
      ...emptyRefs,
      type: "poll_scheduled",
      payload: { start: "2026-10-11T09:00:00.000Z", duration: 60 },
    });

    expect(event?.type).toBe("poll_scheduled");
  });

  it("reads itemized setting changes alongside the earlier collapsed one", () => {
    const result = pollActivitySchema.safeParse({
      type: "poll_updated",
      userId: "u1",
      payload: {
        changes: [
          { field: "disableComments", from: false },
          { field: "settings" },
        ],
      },
    });

    expect(result.success).toBe(true);
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
