import { describe, expect, it } from "vitest";
import { isEligibleForReviewRequest } from "./utils";

describe("isEligibleForReviewRequest", () => {
  it("asks on the second finalized poll with three participants", () => {
    expect(
      isEligibleForReviewRequest({
        finalizedPollCount: 2,
        participantCount: 3,
      }),
    ).toBe(true);
  });

  it("does not ask on the first finalized poll", () => {
    expect(
      isEligibleForReviewRequest({
        finalizedPollCount: 1,
        participantCount: 10,
      }),
    ).toBe(false);
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
