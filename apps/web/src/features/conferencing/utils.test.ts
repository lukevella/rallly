import { describe, expect, it } from "vitest";
import { conferencingSchema } from "./schema";
import {
  getConferencingUri,
  meetSpaceResponseSchema,
  meetSpaceToConferencing,
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
