import { describe, expect, it } from "vitest";
import { MAX_RESPONSE_NOTE_LENGTH } from "@/features/poll/schema";
import { responseNoteInput, timeZoneInput } from "./schema";

describe("timeZoneInput", () => {
  it("normalizes an empty string to null", () => {
    expect(timeZoneInput.parse("")).toBeNull();
  });

  it("passes a timezone through unchanged", () => {
    expect(timeZoneInput.parse("Europe/Berlin")).toBe("Europe/Berlin");
  });

  it("keeps undefined as undefined so modify can mean 'leave unchanged'", () => {
    expect(timeZoneInput.parse(undefined)).toBeUndefined();
  });

  it("keeps null as null", () => {
    expect(timeZoneInput.parse(null)).toBeNull();
  });
});

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
