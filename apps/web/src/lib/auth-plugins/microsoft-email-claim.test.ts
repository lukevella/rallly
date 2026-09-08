import { describe, expect, it } from "vitest";

import {
  readMicrosoftEmailClaim,
  rememberMicrosoftEmailClaim,
  takeMicrosoftEmailClaim,
} from "./microsoft-email-claim";

describe("readMicrosoftEmailClaim", () => {
  it("is absent when the registration emits no verification claim", () => {
    expect(readMicrosoftEmailClaim({ email: "a@example.com" })).toBe("absent");
  });

  it("is verified when the address is in the primary list", () => {
    expect(
      readMicrosoftEmailClaim({
        email: "A@Example.com",
        verified_primary_email: ["a@example.com"],
      }),
    ).toBe("verified");
  });

  it("is verified when the address is only in the secondary list", () => {
    expect(
      readMicrosoftEmailClaim({
        email: "a@example.com",
        verified_primary_email: [],
        verified_secondary_email: ["a@example.com"],
      }),
    ).toBe("verified");
  });

  it("is unverified when the claim is present but does not carry the address", () => {
    expect(
      readMicrosoftEmailClaim({
        email: "victim@example.com",
        verified_primary_email: ["attacker@tenant.example"],
      }),
    ).toBe("unverified");
  });

  it("is unverified when the claim is present and empty", () => {
    expect(
      readMicrosoftEmailClaim({
        email: "a@example.com",
        verified_primary_email: [],
      }),
    ).toBe("unverified");
  });

  it("prefers an explicit email_verified claim", () => {
    expect(
      readMicrosoftEmailClaim({
        email: "a@example.com",
        email_verified: false,
        verified_primary_email: ["a@example.com"],
      }),
    ).toBe("unverified");
  });
});

describe("claim registry", () => {
  it("hands the reading over once, case-insensitively", () => {
    rememberMicrosoftEmailClaim({ email: "Hand@Off.test", claim: "absent" });
    expect(takeMicrosoftEmailClaim("hand@off.test")).toBe("absent");
    expect(takeMicrosoftEmailClaim("hand@off.test")).toBeUndefined();
  });
});
