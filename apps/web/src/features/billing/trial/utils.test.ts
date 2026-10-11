import { describe, expect, it } from "vitest";
import {
  getTrialDaysLeft,
  getTrialEndDate,
  getTrialState,
} from "@/features/billing/trial/utils";

const now = new Date("2026-10-10T12:00:00Z");
const future = new Date("2026-10-20T12:00:00Z");
const past = new Date("2026-10-01T12:00:00Z");

describe("getTrialState", () => {
  it("offers the trial to a free space that never had one", () => {
    expect(
      getTrialState(
        {
          tier: "hobby",
          trialStartedAt: null,
          trialEndsAt: null,
          subscriptionActive: false,
        },
        now,
      ),
    ).toBe("eligible");
  });

  it("reports a running trial on a pro space without a subscription", () => {
    expect(
      getTrialState(
        {
          tier: "pro",
          trialStartedAt: past,
          trialEndsAt: future,
          subscriptionActive: false,
        },
        now,
      ),
    ).toBe("trial");
  });

  it("reports paying over everything else, so the days-left line hides", () => {
    expect(
      getTrialState(
        {
          tier: "pro",
          trialStartedAt: past,
          trialEndsAt: future,
          subscriptionActive: true,
        },
        now,
      ),
    ).toBe("paying");
  });

  it("reports ended once the end has passed, even before the hourly job", () => {
    expect(
      getTrialState(
        {
          tier: "pro",
          trialStartedAt: past,
          trialEndsAt: new Date("2026-10-10T11:00:00Z"),
          subscriptionActive: false,
        },
        now,
      ),
    ).toBe("ended");
    expect(
      getTrialState(
        {
          tier: "hobby",
          trialStartedAt: past,
          trialEndsAt: new Date("2026-10-10T11:00:00Z"),
          subscriptionActive: false,
        },
        now,
      ),
    ).toBe("ended");
  });

  it("has nothing to say about a pro space that never had a trial", () => {
    expect(
      getTrialState(
        {
          tier: "pro",
          trialStartedAt: null,
          trialEndsAt: null,
          subscriptionActive: false,
        },
        now,
      ),
    ).toBe("none");
  });
});

describe("getTrialDaysLeft", () => {
  it("counts a part day as a whole one", () => {
    expect(getTrialDaysLeft(new Date("2026-10-19T13:00:00Z"), now)).toBe(10);
  });

  it("never goes below zero", () => {
    expect(getTrialDaysLeft(past, now)).toBe(0);
  });

  it("reads 14 right after the start", () => {
    expect(getTrialDaysLeft(getTrialEndDate(now), now)).toBe(14);
  });
});
