import { describe, expect, it } from "vitest";
import {
  getFirstName,
  isEligibleForReviewRequest,
  offersChatReview,
  pickReviewSite,
} from "./utils";

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

describe("pickReviewSite", () => {
  it("sends free mail addresses to Trustpilot", () => {
    expect(pickReviewSite({ email: "Ada@Gmail.com" })).toBe("trustpilot");
  });

  it("sends company addresses to G2", () => {
    expect(pickReviewSite({ email: "ada@example.com" })).toBe("g2");
  });

  it("does not treat a subdomain of a free mail provider as consumer", () => {
    expect(pickReviewSite({ email: "ada@corp.gmail.com.example" })).not.toBe(
      "trustpilot",
    );
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

describe("offersChatReview", () => {
  it("is true for G2, whose chat option is quicker than its form", () => {
    expect(offersChatReview("g2")).toBe(true);
  });

  it("is false for Trustpilot, which has no chat option", () => {
    expect(offersChatReview("trustpilot")).toBe(false);
  });
});
