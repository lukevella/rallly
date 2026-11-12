import { describe, expect, it } from "vitest";
import { getFirstName, isEligibleForReviewRequest } from "./utils";

describe("isEligibleForReviewRequest", () => {
  it("asks on the first finalized poll with three participants", () => {
    expect(
      isEligibleForReviewRequest({
        finalizedPollCount: 1,
        participantCount: 3,
      }),
    ).toBe(true);
  });

  it("does not ask when fewer than three people responded", () => {
    expect(
      isEligibleForReviewRequest({
        finalizedPollCount: 5,
        participantCount: 2,
      }),
    ).toBe(false);
  });
});

describe("getFirstName", () => {
  it("takes the first word of the name", () => {
    expect(getFirstName("  Ada Lovelace ")).toBe("Ada");
  });

  it("returns nothing for a name that is an email address", () => {
    expect(getFirstName("ada@example.com")).toBe("");
  });

  it("returns nothing for a blank name", () => {
    expect(getFirstName("   ")).toBe("");
  });
});
