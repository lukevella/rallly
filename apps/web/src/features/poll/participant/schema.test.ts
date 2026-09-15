import { describe, expect, it } from "vitest";
import { MAX_RESPONSE_NOTE_LENGTH } from "@/features/poll/schema";
import { addParticipantSchema, responseNoteInput } from "./schema";

describe("responseNoteInput", () => {
  it("trims surrounding whitespace", () => {
    expect(responseNoteInput.parse("  running late  ")).toBe("running late");
  });

  it("collapses a whitespace only note to undefined", () => {
    expect(responseNoteInput.parse("   \n ")).toBeUndefined();
  });

  it("keeps undefined as undefined", () => {
    expect(responseNoteInput.parse(undefined)).toBeUndefined();
  });

  it("rejects notes over the maximum length", () => {
    expect(() =>
      responseNoteInput.parse("a".repeat(MAX_RESPONSE_NOTE_LENGTH + 1)),
    ).toThrow();
  });

  it("accepts a note at the maximum length", () => {
    const note = "a".repeat(MAX_RESPONSE_NOTE_LENGTH);
    expect(responseNoteInput.parse(note)).toBe(note);
  });
});

describe("addParticipantSchema email", () => {
  it("normalizes a blank email to undefined", () => {
    expect(
      addParticipantSchema.parse({
        pollId: "p",
        name: "A",
        email: "  ",
        votes: [],
      }).email,
    ).toBeUndefined();
  });

  it("rejects a malformed email", () => {
    expect(
      addParticipantSchema.safeParse({
        pollId: "p",
        name: "A",
        email: "not-an-email",
        votes: [],
      }).success,
    ).toBe(false);
  });
});
