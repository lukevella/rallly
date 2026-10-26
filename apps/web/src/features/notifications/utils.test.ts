import { describe, expect, it } from "vitest";
import { createSignature } from "@/lib/signature";
import { getNotificationPreferenceKey } from "./schema";
import type { UnsubscribeTarget } from "./utils";
import {
  createUnsubscribeToken,
  getInboxActivityTypes,
  parseNotificationPreferences,
  parseUnsubscribeToken,
  toInboxEvent,
} from "./utils";

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
    const payload = Buffer.from(
      JSON.stringify({ k: "sheet", p: "poll_123", u: "user_456" }),
    ).toString("base64url");
    const signature = createSignature({
      context: "unsubscribe",
      payload,
      secret,
    });
    expect(
      parseUnsubscribeToken({ token: `${payload}~${signature}`, secret }),
    ).toBeNull();
  });

  it("rejects malformed tokens", () => {
    for (const token of ["", "abc", "a~b~c", "!!!~???", "bm90LWpzb24~sig"]) {
      expect(parseUnsubscribeToken({ token, secret })).toBeNull();
    }
  });
});

describe("notification preferences", () => {
  it("keeps email keys unprefixed and prefixes in-app keys", () => {
    expect(getNotificationPreferenceKey("poll.comment.added", "email")).toBe(
      "poll.comment.added",
    );
    expect(getNotificationPreferenceKey("poll.comment.added", "inApp")).toBe(
      "inApp:poll.comment.added",
    );
  });

  it("keeps stored email choices on rows written before in-app keys existed", () => {
    expect(
      parseNotificationPreferences({
        "poll.response.submitted": false,
        "poll.comment.added": true,
      }),
    ).toEqual({
      "poll.response.submitted": false,
      "poll.comment.added": true,
      "inApp:poll.response.submitted": true,
      "inApp:poll.comment.added": true,
    });
  });

  it("falls back to defaults for missing or malformed prefs", () => {
    const defaults = parseNotificationPreferences(undefined);
    expect(Object.values(defaults).every(Boolean)).toBe(true);
    expect(
      parseNotificationPreferences({ "poll.comment.added": "no" }),
    ).toEqual(defaults);
  });
});

describe("inbox", () => {
  const prefs = parseNotificationPreferences({});

  it("lists the activity types the in-app preferences allow", () => {
    expect(getInboxActivityTypes(prefs)).toEqual([
      "response_created",
      "comment_added",
    ]);
    expect(
      getInboxActivityTypes({ ...prefs, "inApp:poll.comment.added": false }),
    ).toEqual(["response_created"]);
    // The email switch does not affect the inbox.
    expect(
      getInboxActivityTypes({ ...prefs, "poll.response.submitted": false }),
    ).toHaveLength(2);
  });

  const row = {
    userId: "user_1",
    participantId: null,
    inviteId: null,
    optionId: null,
  };

  it("maps responses and comments to their event and actor", () => {
    expect(
      toInboxEvent({
        ...row,
        type: "response_created",
        participantId: "participant_1",
        payload: { name: "Alice" },
      }),
    ).toEqual({ type: "poll.response.submitted", actorName: "Alice" });
    expect(
      toInboxEvent({ ...row, type: "comment_added", payload: { name: "Bob" } }),
    ).toEqual({ type: "poll.comment.added", actorName: "Bob" });
  });

  it("skips activity the inbox does not render", () => {
    expect(
      toInboxEvent({ ...row, type: "poll_reopened", payload: {} }),
    ).toBeNull();
    expect(
      toInboxEvent({ ...row, type: "from_a_newer_deploy", payload: {} }),
    ).toBeNull();
  });
});
