import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { conferencingSchema } from "./schema";
import {
  createZoomUrlValidationResponse,
  getConferencingUri,
  meetSpaceResponseSchema,
  meetSpaceToConferencing,
  verifyZoomWebhookSignature,
  zoomMeetingResponseSchema,
  zoomMeetingToConferencing,
} from "./utils";

describe("zoomMeetingToConferencing", () => {
  it("maps a Zoom meeting into the stored link shape", () => {
    const meeting = zoomMeetingResponseSchema.parse({
      id: 81234567890,
      join_url: "https://zoom.us/j/81234567890?pwd=abc",
      password: "abc",
      topic: "ignored",
    });
    const conferencing = zoomMeetingToConferencing(meeting);
    expect(conferencing).toEqual({
      provider: "zoom",
      uri: "https://zoom.us/j/81234567890?pwd=abc",
      meetingId: "81234567890",
      password: "abc",
    });
    expect(conferencingSchema.parse(conferencing)).toEqual(conferencing);
    expect(getConferencingUri(conferencing)).toBe(
      "https://zoom.us/j/81234567890?pwd=abc",
    );
  });

  it("drops an empty password", () => {
    const meeting = zoomMeetingResponseSchema.parse({
      id: 1,
      join_url: "https://zoom.us/j/1",
      password: "",
    });
    expect(zoomMeetingToConferencing(meeting)).toEqual({
      provider: "zoom",
      uri: "https://zoom.us/j/1",
      meetingId: "1",
      password: undefined,
    });
  });
});

describe("meetSpaceToConferencing", () => {
  it("maps a Meet space into the stored link shape", () => {
    const space = meetSpaceResponseSchema.parse({
      name: "spaces/abc",
      meetingUri: "https://meet.google.com/abc-defg-hij",
      meetingCode: "abc-defg-hij",
    });
    const conferencing = meetSpaceToConferencing(space);
    expect(conferencing).toEqual({
      provider: "meet",
      uri: "https://meet.google.com/abc-defg-hij",
      meetingId: "abc-defg-hij",
    });
    expect(conferencingSchema.parse(conferencing)).toEqual(conferencing);
  });

  it("rejects a space without a join link", () => {
    expect(
      meetSpaceResponseSchema.safeParse({ name: "spaces/abc" }).success,
    ).toBe(false);
  });
});

describe("verifyZoomWebhookSignature", () => {
  const secretToken = "zoom-secret-token";
  const body = JSON.stringify({ event: "app_deauthorized" });
  const now = new Date("2026-09-26T12:00:00Z");
  const timestamp = String(now.getTime() / 1000);
  const sign = (message: string) =>
    `v0=${createHmac("sha256", secretToken).update(message).digest("hex")}`;

  it("accepts a request Zoom signed", async () => {
    await expect(
      verifyZoomWebhookSignature({
        secretToken,
        signature: sign(`v0:${timestamp}:${body}`),
        timestamp,
        body,
        now,
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("rejects a body changed after signing", async () => {
    await expect(
      verifyZoomWebhookSignature({
        secretToken,
        signature: sign(`v0:${timestamp}:${body}`),
        timestamp,
        body: body.replace("app_deauthorized", "something_else"),
        now,
      }),
    ).resolves.toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects a signature that is not hex", async () => {
    await expect(
      verifyZoomWebhookSignature({
        secretToken,
        signature: "v0=not-hex",
        timestamp,
        body,
        now,
      }),
    ).resolves.toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects a timestamp more than five minutes away", async () => {
    const stale = String(now.getTime() / 1000 - 301);
    await expect(
      verifyZoomWebhookSignature({
        secretToken,
        signature: sign(`v0:${stale}:${body}`),
        timestamp: stale,
        body,
        now,
      }),
    ).resolves.toEqual({ ok: false, reason: "stale" });
  });

  it("rejects a request without the signing headers", async () => {
    await expect(
      verifyZoomWebhookSignature({
        secretToken,
        signature: null,
        timestamp,
        body,
        now,
      }),
    ).resolves.toEqual({ ok: false, reason: "missing_headers" });
  });
});

describe("createZoomUrlValidationResponse", () => {
  it("returns the plain token with its hex HMAC", async () => {
    await expect(
      createZoomUrlValidationResponse({
        secretToken: "zoom-secret-token",
        plainToken: "qgg8vlvZRS6UYooatFL8Aw",
      }),
    ).resolves.toEqual({
      plainToken: "qgg8vlvZRS6UYooatFL8Aw",
      encryptedToken: createHmac("sha256", "zoom-secret-token")
        .update("qgg8vlvZRS6UYooatFL8Aw")
        .digest("hex"),
    });
  });
});
