import { describe, expect, it } from "vitest";
import {
  getFirstName,
  getReviewGuidelinesUrl,
  isEligibleForReviewRequest,
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
    expect(pickReviewSite({ userId: "user-1", email: "Ada@Gmail.com" })).toBe(
      "trustpilot",
    );
  });

  it("splits company addresses evenly across the business sites", () => {
    const counts = { capterra: 0, g2: 0, trustpilot: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[
        pickReviewSite({ userId: `user-${i}`, email: "ada@example.com" })
      ]++;
    }
    expect(counts.trustpilot).toBe(0);
    expect(counts.capterra).toBeGreaterThan(400);
    expect(counts.g2).toBeGreaterThan(400);
  });

  it("always picks the same business site for a user", () => {
    const site = pickReviewSite({ userId: "user-1", email: "ada@example.com" });
    expect(pickReviewSite({ userId: "user-1", email: "ada@example.com" })).toBe(
      site,
    );
  });

  it("does not treat a subdomain of a free mail provider as consumer", () => {
    expect(
      pickReviewSite({
        userId: "user-1",
        email: "ada@corp.gmail.com.example",
      }),
    ).not.toBe("trustpilot");
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
