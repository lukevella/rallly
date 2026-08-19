import { describe, expect, it } from "vitest";
import {
  getAccountDeletionCutoff,
  getScheduledDeletionDate,
  toAccountDeletionOTPIdentifier,
} from "./utils";

describe("getScheduledDeletionDate", () => {
  it("adds the grace period", () => {
    const deletedAt = new Date("2026-07-01T00:00:00Z");
    expect(getScheduledDeletionDate(deletedAt)).toEqual(
      new Date("2026-07-08T00:00:00Z"),
    );
  });
});

describe("getAccountDeletionCutoff", () => {
  it("subtracts the grace period", () => {
    const now = new Date("2026-07-08T00:00:00Z");
    expect(getAccountDeletionCutoff(now)).toEqual(
      new Date("2026-07-01T00:00:00Z"),
    );
  });
});

describe("toAccountDeletionOTPIdentifier", () => {
  it("is keyed by user id", () => {
    expect(toAccountDeletionOTPIdentifier("user-1")).toBe(
      "delete-account-otp-user-1",
    );
  });

  // Better-Auth stores its own codes as `${type}-otp-${email}`. A deletion
  // identifier that collided with one of those would let a login code delete
  // the account.
  it("cannot collide with a Better-Auth OTP identifier", () => {
    const identifier = toAccountDeletionOTPIdentifier("user-1");

    for (const type of ["sign-in", "email-verification", "forget-password"]) {
      expect(identifier).not.toBe(`${type}-otp-user-1`);
      expect(identifier).not.toBe(`${type}-otp-user-1@example.com`);
    }
  });
});
