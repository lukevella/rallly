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
  const poll = {
    id: "Xk3pQ9vLm2Ab",
    title: "Team sync",
    status: "open" as const,
    kind: "time" as const,
    timeZone: "Europe/London",
  };
  const createdAt = new Date("2026-09-15T10:00:00.000Z");
  const vote = {
    optionId: "opt_1",
    start: "2026-10-01T09:00:00.000Z",
    duration: 30,
    type: "yes" as const,
  };
  const availability = {
    start: "2026-10-01T09:00:00.000Z",
    end: "2026-10-01T09:30:00.000Z",
    allDay: false,
    modifiers: [],
  };

  it("derives the status from the event, not the live poll", () => {
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
        participantId: null,
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
        poll: { status: "scheduled" },
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

  it("marks a created poll as open whatever the live status", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_7",
        type: "poll_created",
        participantId: null,
        optionId: null,
        payload: { title: "Team sync" },
        createdAt,
      },
      poll: { ...poll, status: "closed" },
    });

    expect(payload?.type).toBe("poll.created");
    expect(payload?.data.poll.status).toBe("open");
  });

  it.each([
    "poll_updated",
    "poll_deleted",
  ] as const)("carries the live status on %s", (type) => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_8",
        type,
        participantId: null,
        optionId: null,
        payload: {},
        createdAt,
      },
      poll: { ...poll, status: "scheduled" },
    });

    expect(payload?.type).toBe(type.replace("_", "."));
    expect(payload?.data).toEqual({
      poll: expect.objectContaining({ id: poll.id, status: "scheduled" }),
    });
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
        payload: { name: "Jessie", email: "jessie@example.com", votes: [vote] },
        createdAt,
      },
      poll,
    });

    expect(payload).toEqual({
      version: expect.any(String),
      id: "act_9",
      createdAt: "2026-09-15T10:00:00.000Z",
      type: eventType,
      data: {
        poll: expect.objectContaining({ id: poll.id, status: "open" }),
        participant: {
          id: "part_1",
          name: "Jessie",
          email: "jessie@example.com",
          availability: [availability],
        },
      },
    });
  });

  it("turns votes into availability: no is absent, ifNeedBe is a modifier, all-day spans the day", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_12",
        type: "response_created",
        participantId: "part_1",
        optionId: null,
        payload: {
          name: "Jessie",
          votes: [
            {
              ...vote,
              optionId: "opt_3",
              start: "2026-10-03T00:00:00.000Z",
              duration: 0,
              type: "no",
            },
            {
              ...vote,
              optionId: "opt_2",
              start: "2026-10-02T00:00:00.000Z",
              duration: 0,
              type: "ifNeedBe",
            },
            { ...vote, start: "2026-10-01T00:00:00.000Z", duration: 0 },
          ],
        },
        createdAt,
      },
      poll: { ...poll, kind: "date" },
    });

    expect(payload?.data).toMatchObject({
      participant: {
        availability: [
          {
            start: "2026-10-01T00:00:00.000Z",
            end: "2026-10-02T00:00:00.000Z",
            allDay: true,
            modifiers: [],
          },
          {
            start: "2026-10-02T00:00:00.000Z",
            end: "2026-10-03T00:00:00.000Z",
            allDay: true,
            modifiers: ["ifNeedBe"],
          },
        ],
      },
    });
  });

  it("sends null for a participant without an email", () => {
    const payload = buildWebhookPayload({
      activity: {
        id: "act_10",
        type: "response_created",
        participantId: "part_1",
        optionId: null,
        payload: { name: "Jessie", votes: [] },
        createdAt,
      },
      poll,
    });

    expect(payload?.data).toMatchObject({
      participant: { email: null, availability: [] },
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
          payload: { name: "Jessie", votes: [] },
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
