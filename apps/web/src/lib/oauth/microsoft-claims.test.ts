import { describe, expect, it } from "vitest";
import { isMicrosoftEmailVerified } from "./microsoft-claims";

describe("isMicrosoftEmailVerified", () => {
  it("trusts the domain owner verified claim personal accounts carry", () => {
    expect(
      isMicrosoftEmailVerified({ email: "user@outlook.com", xms_edov: true }),
    ).toBe(true);
  });

  it("reads the domain owner verified claim in the string form Microsoft emits", () => {
    expect(
      isMicrosoftEmailVerified({ email: "user@outlook.com", xms_edov: "1" }),
    ).toBe(true);
    expect(
      isMicrosoftEmailVerified({ email: "user@outlook.com", xms_edov: "true" }),
    ).toBe(true);
    expect(
      isMicrosoftEmailVerified({ email: "user@outlook.com", xms_edov: "0" }),
    ).toBe(false);
    expect(
      isMicrosoftEmailVerified({
        email: "user@outlook.com",
        xms_edov: "false",
      }),
    ).toBe(false);
  });

  it("trusts an explicit email_verified claim", () => {
    expect(
      isMicrosoftEmailVerified({
        email: "user@example.com",
        email_verified: true,
      }),
    ).toBe(true);
  });

  it("trusts the verified email lists work accounts carry", () => {
    expect(
      isMicrosoftEmailVerified({
        email: "User@Example.com",
        verified_primary_email: ["user@example.com"],
      }),
    ).toBe(true);
    expect(
      isMicrosoftEmailVerified({
        email: "user@example.com",
        verified_secondary_email: ["other@example.com", "user@example.com"],
      }),
    ).toBe(true);
  });

  it("refuses an address the lists do not contain", () => {
    expect(
      isMicrosoftEmailVerified({
        email: "user@example.com",
        verified_primary_email: ["other@example.com"],
      }),
    ).toBe(false);
  });

  it("refuses when Microsoft vouches for nothing", () => {
    expect(isMicrosoftEmailVerified({ email: "user@outlook.com" })).toBe(false);
    expect(
      isMicrosoftEmailVerified({ email: "user@outlook.com", xms_edov: false }),
    ).toBe(false);
    expect(isMicrosoftEmailVerified({ xms_edov: false })).toBe(false);
  });
});
