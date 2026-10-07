import { describe, expect, it } from "vitest";
import {
  getFirstName,
  getReviewGuidelinesUrl,
  isEligibleForReviewRequest,
  pickReviewSite,
} from "./utils";

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

describe("pickReviewSite", () => {
  it("sends free mail addresses to Trustpilot", () => {
    expect(
      pickReviewSite({ email: "Ada@Gmail.com", businessSite: "capterra" }),
    ).toBe("trustpilot");
  });

  it("sends company addresses to the business site", () => {
    expect(
      pickReviewSite({ email: "ada@example.com", businessSite: "capterra" }),
    ).toBe("capterra");
    expect(
      pickReviewSite({ email: "ada@example.com", businessSite: "g2" }),
    ).toBe("g2");
  });

  it("does not treat a subdomain of a free mail provider as consumer", () => {
    expect(
      pickReviewSite({
        email: "ada@corp.gmail.com.example",
        businessSite: "g2",
      }),
    ).toBe("g2");
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

describe("getReviewGuidelinesUrl", () => {
  it("links Capterra's community guidelines, which its vendor terms require", () => {
    expect(getReviewGuidelinesUrl("capterra")).toBe(
      "https://www.capterra.com/legal/community-guidelines/",
    );
  });

  it("returns nothing for a site without the requirement", () => {
    expect(getReviewGuidelinesUrl("trustpilot")).toBeUndefined();
  });
});
