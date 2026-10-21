import { describe, expect, it } from "vitest";
import { toGuestSessionResult } from "./utils";

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
