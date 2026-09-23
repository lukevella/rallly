import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MAX_CONSECUTIVE_FAILURES, WEBHOOK_VERSION } from "./constants";
import { webhookPingEventSchema } from "./schema";
import {
  buildWebhookPayload,
  buildWebhookTestPayload,
  getRetryDelayMs,
  getWebhookHealth,
  isPrivateAddress,
  signWebhookBody,
  toWebhookEventType,
} from "./utils";

describe("signWebhookBody", () => {
  it("produces t=<unix>,v1=<hmac-sha256(secret, t.body)>", async () => {
    const body = '{"hello":"world"}';
    const secret = "whsec_test";
    const timestamp = 1_700_000_000;

    const expectedDigest = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    expect(await signWebhookBody({ secret, body, timestamp })).toBe(
      `t=${timestamp},v1=${expectedDigest}`,
    );
  });

  it("changes when the body changes", async () => {
    const a = await signWebhookBody({ secret: "s", body: "a", timestamp: 1 });
    const b = await signWebhookBody({ secret: "s", body: "b", timestamp: 1 });
    expect(a).not.toBe(b);
  });
});

describe("getRetryDelayMs", () => {
  it("follows the 1m, 5m, 30m, 2h, 12h schedule by attempt number", () => {
    expect(getRetryDelayMs(1)).toBe(60_000);
    expect(getRetryDelayMs(2)).toBe(5 * 60_000);
    expect(getRetryDelayMs(3)).toBe(30 * 60_000);
    expect(getRetryDelayMs(4)).toBe(2 * 60 * 60_000);
    expect(getRetryDelayMs(5)).toBe(12 * 60 * 60_000);
  });

  it("is exhausted after the sixth attempt", () => {
    expect(getRetryDelayMs(6)).toBeNull();
    expect(getRetryDelayMs(7)).toBeNull();
  });
});

describe("toWebhookEventType", () => {
  it("maps poll lifecycle activities to their event names", () => {
    expect(toWebhookEventType("poll_created")).toBe("poll.created");
    expect(toWebhookEventType("poll_updated")).toBe("poll.updated");
    expect(toWebhookEventType("poll_closed")).toBe("poll.closed");
    expect(toWebhookEventType("poll_reopened")).toBe("poll.reopened");
    expect(toWebhookEventType("poll_scheduled")).toBe("poll.scheduled");
    expect(toWebhookEventType("poll_deleted")).toBe("poll.deleted");
  });

  it("files response activities under the poll resource", () => {
    expect(toWebhookEventType("response_created")).toBe(
      "poll.participant.created",
    );
    expect(toWebhookEventType("response_updated")).toBe(
      "poll.participant.updated",
    );
    expect(toWebhookEventType("response_deleted")).toBe(
      "poll.participant.deleted",
    );
  });

  it("returns null for activities that are not webhook events", () => {
    expect(toWebhookEventType("invite_sent")).toBeNull();
    expect(toWebhookEventType("option_added")).toBeNull();
  });
});

describe("buildWebhookPayload", () => {
  const poll = { id: "Xk3pQ9vLm2Ab", kind: "time" as const };
  const createdAt = new Date("2026-09-15T10:00:00.000Z");

  it("references the poll by id and carries the event's own facts", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_1",
        type: "poll_closed",
        participantId: null,
        optionId: null,
        payload: { reason: "manual" },
        createdAt,
      },
      poll,
    });

    expect(payload).toEqual({
      version: expect.any(String),
      id: "act_1",
      type: "poll.closed",
      createdAt: "2026-09-15T10:00:00.000Z",
      data: { poll: { id: "Xk3pQ9vLm2Ab" }, reason: "manual" },
    });
  });

  it("builds a reopened poll", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_2",
        type: "poll_reopened",
        participantId: null,
        optionId: null,
        payload: {},
        createdAt,
      },
      poll,
    });

    expect(payload?.type).toBe("poll.reopened");
    expect(payload?.data).toEqual({ poll: { id: "Xk3pQ9vLm2Ab" } });
  });

  it("carries the scheduled slot for a time poll", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_3",
        type: "poll_scheduled",
        participantId: null,
        optionId: "opt_1",
        payload: { start: "2026-10-01T09:00:00.000Z", duration: 30 },
        createdAt,
      },
      poll,
    });

    expect(payload).toMatchObject({
      type: "poll.scheduled",
      data: {
        poll: { id: "Xk3pQ9vLm2Ab" },
        event: {
          start: "2026-10-01T09:00:00.000Z",
          end: "2026-10-01T09:30:00.000Z",
          allDay: false,
        },
      },
    });
  });

  it("spans the whole day for a scheduled date poll", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_4",
        type: "poll_scheduled",
        participantId: null,
        optionId: "opt_2",
        payload: { start: "2026-10-01T00:00:00.000Z", duration: 0 },
        createdAt,
      },
      poll: { ...poll, kind: "date" },
    });

    expect(payload?.data).toMatchObject({
      event: {
        start: "2026-10-01T00:00:00.000Z",
        end: "2026-10-02T00:00:00.000Z",
        allDay: true,
      },
    });
  });

  it.each([
    ["poll_created", "poll.created", { title: "Team sync" }],
    ["poll_updated", "poll.updated", {}],
    ["poll_deleted", "poll.deleted", {}],
  ] as const)("builds %s as a bare reference to the poll", (type, eventType, activityPayload) => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_8",
        type,
        participantId: null,
        optionId: null,
        payload: activityPayload,
        createdAt,
      },
      poll,
    });

    expect(payload?.type).toBe(eventType);
    expect(payload?.data).toEqual({ poll: { id: poll.id } });
  });

  it.each([
    ["response_created", "poll.participant.created"],
    ["response_updated", "poll.participant.updated"],
    ["response_deleted", "poll.participant.deleted"],
  ] as const)("builds %s from the response snapshot", (type, eventType) => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_9",
        type,
        participantId: "part_1",
        optionId: null,
        // response_deleted requires the vote snapshot; the others ignore it
        payload: { name: "Jessie", votes: [] },
        createdAt,
      },
      poll,
    });

    expect(payload).toEqual({
      version: expect.any(String),
      id: "act_9",
      createdAt: "2026-09-15T10:00:00.000Z",
      type: eventType,
      data: { poll: { id: poll.id }, participant: { id: "part_1" } },
    });
  });

  it("returns null when a response row lost its participant ref", () => {
    expect(
      buildWebhookPayload({
        activity: {
          id: "act_11",
          type: "response_created",
          participantId: null,
          optionId: null,
          payload: { name: "Jessie" },
          createdAt,
        },
        poll,
      }),
    ).toBeNull();
  });

  it("returns null for activities that are not webhook events", () => {
    expect(
      buildWebhookPayload({
        activity: {
          id: "act_5",
          type: "invite_sent",
          participantId: null,
          optionId: null,
          payload: { email: "jessie@example.com" },
          createdAt,
        },
        poll,
      }),
    ).toBeNull();
  });

  it("returns null when the activity payload is malformed", () => {
    expect(
      buildWebhookPayload({
        activity: {
          id: "act_6",
          type: "poll_scheduled",
          participantId: null,
          optionId: "opt_1",
          payload: {},
          createdAt,
        },
        poll,
      }),
    ).toBeNull();
  });
});

describe("buildWebhookTestPayload", () => {
  it("builds a ping in the shared envelope with no data", () => {
    const payload = buildWebhookTestPayload({
      id: "ping_abc",
      createdAt: new Date("2026-09-23T10:00:00.000Z"),
    });
    expect(payload).toEqual({
      version: WEBHOOK_VERSION,
      id: "ping_abc",
      type: "ping",
      createdAt: "2026-09-23T10:00:00.000Z",
      data: {},
    });
    expect(webhookPingEventSchema.safeParse(payload).success).toBe(true);
  });
});

describe("getWebhookHealth", () => {
  it("is idle when enabled and nothing has been attempted", () => {
    expect(getWebhookHealth({ enabled: true, consecutiveFailures: 0 })).toBe(
      "idle",
    );
  });

  it("is healthy when the last attempt succeeded", () => {
    expect(
      getWebhookHealth({
        enabled: true,
        consecutiveFailures: 0,
        lastAttempt: { status: "succeeded" },
      }),
    ).toBe("healthy");
  });

  it("is failing as soon as an attempt fails, before any event exhausts", () => {
    expect(
      getWebhookHealth({
        enabled: true,
        consecutiveFailures: 0,
        lastAttempt: { status: "failed" },
      }),
    ).toBe("failing");
  });

  it("is failing while exhausted events are counted against it", () => {
    expect(
      getWebhookHealth({
        enabled: true,
        consecutiveFailures: 3,
        lastAttempt: { status: "succeeded" },
      }),
    ).toBe("failing");
  });

  it("tells a dispatcher disable apart from an owner disable", () => {
    expect(
      getWebhookHealth({
        enabled: false,
        consecutiveFailures: MAX_CONSECUTIVE_FAILURES,
        lastAttempt: { status: "exhausted" },
      }),
    ).toBe("disabled_after_failures");
    expect(
      getWebhookHealth({
        enabled: false,
        consecutiveFailures: 4,
        lastAttempt: { status: "failed" },
      }),
    ).toBe("disabled");
  });
});

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "127.10.0.1",
    "0.0.0.0",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "198.18.0.1",
    "198.19.255.255",
    "192.0.0.1",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
    "::ffff:c0a8:0101",
  ])("rejects %s", (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "172.32.0.1",
    "198.20.0.1",
    "198.52.100.1",
    "2606:4700:4700::1111",
    "::ffff:8.8.8.8",
  ])("allows %s", (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });
});
