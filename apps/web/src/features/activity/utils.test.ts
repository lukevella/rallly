import { describe, expect, it } from "vitest";
import { getPollChanges } from "./utils";

const prior = {
  title: "Team lunch",
  description: null,
  location: "Cafe",
  conferencing: null,
  timeZone: "Europe/London",
  hideParticipants: false,
  hideScores: false,
  disableComments: false,
  allowTentativeVotes: true,
  requireParticipantEmail: false,
};

const unchanged = { timeZone: "Europe/London" };

describe("getPollChanges", () => {
  it("records nothing when the edit leaves every field as it was", () => {
    expect(
      getPollChanges({
        prior,
        next: { ...unchanged, title: "Team lunch", location: "Cafe" },
      }),
    ).toEqual([]);
  });

  it("keeps the old title", () => {
    expect(
      getPollChanges({ prior, next: { ...unchanged, title: "Team dinner" } }),
    ).toEqual([{ field: "title", from: "Team lunch" }]);
  });

  it("tells an added value from a changed or removed one", () => {
    expect(
      getPollChanges({
        prior,
        next: { ...unchanged, description: "Bring snacks", location: "" },
      }),
    ).toEqual([
      { field: "description", action: "added", from: null },
      { field: "location", action: "removed", from: "Cafe" },
    ]);
  });

  it("treats an empty string as no value", () => {
    expect(
      getPollChanges({
        prior: { ...prior, description: "" },
        next: { ...unchanged, description: "" },
      }),
    ).toEqual([]);
  });

  it("records a changed video call with the previous one", () => {
    expect(
      getPollChanges({
        prior: { ...prior, conferencing: { provider: "zoom" } },
        next: { ...unchanged, conferencing: { provider: "meet" } },
      }),
    ).toEqual([
      { field: "conferencing", action: "changed", from: { provider: "zoom" } },
    ]);
  });

  it("records a time zone change", () => {
    expect(getPollChanges({ prior, next: { timeZone: null } })).toEqual([
      { field: "timeZone", from: "Europe/London" },
    ]);
  });

  it("records each setting turned on with its previous value", () => {
    expect(
      getPollChanges({
        prior,
        next: {
          ...unchanged,
          hideParticipants: true,
          hideScores: true,
          disableComments: true,
          requireParticipantEmail: true,
        },
      }),
    ).toEqual([
      { field: "hideParticipants", from: false },
      { field: "hideScores", from: false },
      { field: "disableComments", from: false },
      { field: "requireParticipantEmail", from: false },
    ]);
  });

  it("records a setting turned off with its previous value", () => {
    expect(
      getPollChanges({
        prior: { ...prior, disableComments: true },
        next: {
          ...unchanged,
          allowTentativeVotes: false,
          disableComments: false,
        },
      }),
    ).toEqual([
      { field: "disableComments", from: true },
      { field: "allowTentativeVotes", from: true },
    ]);
  });

  it("records no setting change when a save resends the current values", () => {
    expect(
      getPollChanges({
        prior,
        next: {
          ...unchanged,
          hideParticipants: false,
          hideScores: false,
          disableComments: false,
          allowTentativeVotes: true,
          requireParticipantEmail: false,
        },
      }),
    ).toEqual([]);
  });
});
