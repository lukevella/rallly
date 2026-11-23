import { describe, expect, it } from "vitest";
import { isOwnAvatarKey, toGuestSessionResult } from "./utils";

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
