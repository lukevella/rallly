import { describe, expect, it } from "vitest";
import { getAccountDeletionCutoff, getScheduledDeletionDate } from "./utils";

describe("getScheduledDeletionDate", () => {
  it("returns the date 7 days after deletion was requested", () => {
    const deletedAt = new Date("2026-07-19T10:00:00Z");
    expect(getScheduledDeletionDate(deletedAt)).toEqual(
      new Date("2026-07-26T10:00:00Z"),
    );
  });
});

describe("getAccountDeletionCutoff", () => {
  it("returns the instant 7 days before now", () => {
    const now = new Date("2026-07-26T10:00:00Z");
    expect(getAccountDeletionCutoff(now)).toEqual(
      new Date("2026-07-19T10:00:00Z"),
    );
  });
});
