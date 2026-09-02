import { describe, expect, it } from "vitest";
import type { UnsubscribeTarget } from "./utils";
import { createUnsubscribeToken, parseUnsubscribeToken } from "./utils";

const secret = "0123456789abcdef0123456789abcdef";
const target: UnsubscribeTarget = {
  kind: "poll",
  pollId: "poll_123",
  userId: "user_456",
};

function forge(payload: object, signature: string) {
  return `${Buffer.from(JSON.stringify(payload)).toString("base64url")}~${signature}`;
}

describe("unsubscribe token", () => {
  it("round-trips the target", () => {
    const token = createUnsubscribeToken({ target, secret });
    expect(parseUnsubscribeToken({ token, secret })).toEqual(target);
  });

  it("is URL safe and contains no dot", () => {
    const token = createUnsubscribeToken({ target, secret });
    expect(encodeURIComponent(token)).toBe(token);
    expect(token).not.toContain(".");
  });

  it("rejects a token signed with another secret", () => {
    const token = createUnsubscribeToken({ target, secret: "other-secret" });
    expect(parseUnsubscribeToken({ token, secret })).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const [, signature] = createUnsubscribeToken({ target, secret }).split("~");
    const token = forge(
      { k: "poll", p: "poll_other", u: "user_456" },
      signature,
    );
    expect(parseUnsubscribeToken({ token, secret })).toBeNull();
  });

  it("rejects an unknown kind even when correctly signed", () => {
    const token = createUnsubscribeToken({ target, secret }).replace(
      /^[^~]+/,
      Buffer.from(
        JSON.stringify({ k: "sheet", p: "poll_123", u: "user_456" }),
      ).toString("base64url"),
    );
    // The signature no longer matches, and even a valid one must not parse.
    expect(parseUnsubscribeToken({ token, secret })).toBeNull();
  });

  it("rejects malformed tokens", () => {
    for (const token of ["", "abc", "a~b~c", "!!!~???", "bm90LWpzb24~sig"]) {
      expect(parseUnsubscribeToken({ token, secret })).toBeNull();
    }
  });
});
