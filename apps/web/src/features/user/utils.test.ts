import { describe, expect, it } from "vitest";
import {
  getIdTokenEmail,
  getProvenEmail,
  isOwnAvatarKey,
  toGuestSessionResult,
} from "./utils";

describe("toGuestSessionResult", () => {
  it("succeeds when sign-in returns no error", () => {
    expect(toGuestSessionResult(null)).toEqual({ ok: true });
  });

  it("succeeds when a guest session already exists", () => {
    expect(
      toGuestSessionResult({
        status: 400,
        code: "ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY",
      }),
    ).toEqual({ ok: true });
  });

  it("reports rate limiting", () => {
    expect(toGuestSessionResult({ status: 429 })).toEqual({
      ok: false,
      reason: "tooManyRequests",
    });
  });

  it("fails on any other error", () => {
    expect(toGuestSessionResult({ status: 500 })).toEqual({
      ok: false,
      reason: "sessionUnavailable",
    });
  });
});

describe("isOwnAvatarKey", () => {
  const userId = "user-1";

  it("accepts an avatar key carrying the user's id", () => {
    expect(
      isOwnAvatarKey({ key: "avatars/user-1-1700000000000.png", userId }),
    ).toBe(true);
  });

  it("rejects another user's avatar key", () => {
    expect(
      isOwnAvatarKey({ key: "avatars/user-2-1700000000000.png", userId }),
    ).toBe(false);
  });

  it("rejects keys from other asset slots", () => {
    expect(
      isOwnAvatarKey({ key: "spaces/user-1-1700000000000.png", userId }),
    ).toBe(false);
    expect(
      isOwnAvatarKey({ key: "branding/logo-1700000000000.svg", userId }),
    ).toBe(false);
    expect(
      isOwnAvatarKey({
        key: "nonprofit-documents/user-1-1700000000000.pdf",
        userId,
      }),
    ).toBe(false);
  });

  it("rejects external URLs and arbitrary strings", () => {
    expect(isOwnAvatarKey({ key: "https://example.com/a.png", userId })).toBe(
      false,
    );
    expect(isOwnAvatarKey({ key: "user-1", userId })).toBe(false);
  });
});

describe("getIdTokenEmail", () => {
  const token = (claims: object) =>
    `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;

  it("reads the email claim", () => {
    expect(getIdTokenEmail(token({ email: "jo@example.com" }))).toBe(
      "jo@example.com",
    );
  });

  it("falls back to preferred_username when it is an address", () => {
    expect(
      getIdTokenEmail(token({ preferred_username: "jo@contoso.com" })),
    ).toBe("jo@contoso.com");
  });

  it("ignores a preferred_username that is not an address", () => {
    expect(getIdTokenEmail(token({ preferred_username: "jo" }))).toBeNull();
  });

  it("returns null without a token or for a malformed one", () => {
    expect(getIdTokenEmail(null)).toBeNull();
    expect(getIdTokenEmail("not-a-jwt")).toBeNull();
    expect(getIdTokenEmail("a.%%%.c")).toBeNull();
  });
});

describe("getProvenEmail", () => {
  const trustedLoginMethods = ["email", "google"];
  const user = {
    email: "ann@example.com",
    emailVerified: true,
    isAnonymous: false,
    lastLoginMethod: "email",
  };

  it("returns the email after a trusted sign-in", () => {
    expect(getProvenEmail({ user, trustedLoginMethods })).toBe(
      "ann@example.com",
    );
  });

  it("returns null after an untrusted sign-in", () => {
    expect(
      getProvenEmail({
        user: { ...user, lastLoginMethod: "microsoft" },
        trustedLoginMethods,
      }),
    ).toBeNull();
  });

  it("returns null when no sign-in method is recorded", () => {
    expect(
      getProvenEmail({
        user: { ...user, lastLoginMethod: null },
        trustedLoginMethods,
      }),
    ).toBeNull();
  });

  it("returns null when the email is not verified", () => {
    expect(
      getProvenEmail({
        user: { ...user, lastLoginMethod: "google", emailVerified: false },
        trustedLoginMethods,
      }),
    ).toBeNull();
  });

  it("returns null for a guest", () => {
    expect(
      getProvenEmail({
        user: { ...user, isAnonymous: true },
        trustedLoginMethods,
      }),
    ).toBeNull();
  });
});
