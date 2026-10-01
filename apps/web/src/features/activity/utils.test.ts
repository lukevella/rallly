import { describe, expect, it } from "vitest";
import { getPollChanges } from "./utils";

const prior = {
  title: "Team lunch",
  description: null,
  location: "Cafe",
  conferencing: null,
  timeZone: "Europe/London",
};

const unchanged = { timeZone: "Europe/London", settingsChanged: false };

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

  it("records time zone and settings changes", () => {
    expect(
      getPollChanges({
        prior,
        next: { timeZone: null, settingsChanged: true },
      }),
    ).toEqual([
      { field: "timeZone", from: "Europe/London" },
      { field: "settings" },
    ]);
  });
});
