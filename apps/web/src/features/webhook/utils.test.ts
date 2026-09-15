import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildWebhookPayload,
  getRetryDelayMs,
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
  it("maps status transition activities to their event names", () => {
    expect(toWebhookEventType("poll_closed")).toBe("poll.closed");
    expect(toWebhookEventType("poll_reopened")).toBe("poll.reopened");
    expect(toWebhookEventType("poll_scheduled")).toBe("poll.scheduled");
  });

  it("returns null for activities that are not webhook events", () => {
    expect(toWebhookEventType("response_created")).toBeNull();
    expect(toWebhookEventType("poll_created")).toBeNull();
  });
});

describe("buildWebhookPayload", () => {
  const poll = {
    id: "Xk3pQ9vLm2Ab",
    title: "Team sync",
    kind: "time" as const,
    timeZone: "Europe/London",
  };
  const createdAt = new Date("2026-09-15T10:00:00.000Z");

  it("derives the status from the event, not the live poll", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_1",
        type: "poll_closed",
        optionId: null,
        payload: { reason: "manual" },
        createdAt,
      },
      poll,
    });

    expect(payload).toMatchObject({
      id: "act_1",
      type: "poll.closed",
      createdAt: "2026-09-15T10:00:00.000Z",
      data: {
        poll: {
          id: "Xk3pQ9vLm2Ab",
          title: "Team sync",
          status: "closed",
          kind: "time",
          timeZone: "Europe/London",
        },
        reason: "manual",
      },
    });
    expect(payload?.data.poll.adminUrl).toMatch(/\/poll\/Xk3pQ9vLm2Ab$/);
    expect(payload?.data.poll.inviteUrl).toMatch(/\/invite\/Xk3pQ9vLm2Ab$/);
  });

  it("marks a reopened poll as open", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_2",
        type: "poll_reopened",
        optionId: null,
        payload: {},
        createdAt,
      },
      poll,
    });

    expect(payload?.type).toBe("poll.reopened");
    expect(payload?.data.poll.status).toBe("open");
  });

  it("carries the scheduled slot for a time poll", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_3",
        type: "poll_scheduled",
        optionId: "opt_1",
        payload: { start: "2026-10-01T09:00:00.000Z", duration: 30 },
        createdAt,
      },
      poll,
    });

    expect(payload).toMatchObject({
      type: "poll.scheduled",
      data: {
        poll: { status: "scheduled" },
        option: {
          id: "opt_1",
          startTime: "2026-10-01T09:00:00.000Z",
          duration: 30,
        },
      },
    });
  });

  it("carries the scheduled date for a date poll", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_4",
        type: "poll_scheduled",
        optionId: "opt_2",
        payload: { start: "2026-10-01T00:00:00.000Z", duration: 0 },
        createdAt,
      },
      poll: { ...poll, kind: "date" },
    });

    expect(payload?.data).toMatchObject({
      option: { id: "opt_2", date: "2026-10-01" },
    });
  });

  it("returns null for activities that are not webhook events", () => {
    expect(
      buildWebhookPayload({
        activity: {
          id: "act_5",
          type: "response_created",
          optionId: null,
          payload: { name: "Jessie" },
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
          optionId: "opt_1",
          payload: {},
          createdAt,
        },
        poll,
      }),
    ).toBeNull();
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
    "2606:4700:4700::1111",
    "::ffff:8.8.8.8",
  ])("allows %s", (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });
});
