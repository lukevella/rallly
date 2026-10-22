import { describe, expect, it } from "vitest";
import type { PollActivityEvent } from "./schema";
import { getPollChanges, groupActivity } from "./utils";

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

const at = (iso: string) => new Date(`2026-10-10T${iso}:00.000Z`);
let nextId = 0;
const row = (time: string, event: PollActivityEvent) => ({
  id: `a${nextId++}`,
  createdAt: at(time),
  event,
});
const created = (time: string) =>
  row(time, {
    type: "poll_created",
    userId: "u1",
    payload: { title: "Hike" },
  });
const invited = (time: string, email: string) =>
  row(time, {
    type: "invite_sent",
    userId: "u1",
    inviteId: email,
    payload: { email },
  });
const opened = (time: string, email: string) =>
  row(time, { type: "invite_opened", inviteId: email, payload: { email } });
const responded = (time: string, name: string, note?: string) =>
  row(time, {
    type: "response_created",
    participantId: name,
    payload: note ? { name, note } : { name },
  });
const closed = (time: string) =>
  row(time, {
    type: "poll_closed",
    userId: "u1",
    payload: { reason: "manual" },
  });

const shape = (items: ReturnType<typeof groupActivity>) =>
  items.map((item) =>
    item.kind === "single"
      ? item.row.event.type
      : `${item.type}×${item.rows.length}`,
  );

describe("groupActivity", () => {
  it("merges a run of invites into one group", () => {
    expect(
      shape(
        groupActivity([
          created("05:50"),
          invited("06:14", "a@x.com"),
          invited("06:14", "b@x.com"),
          invited("06:15", "c@x.com"),
        ]),
      ),
    ).toEqual(["poll_created", "invite_sent×3"]);
  });

  it("leaves invite opens out of the feed", () => {
    expect(
      shape(
        groupActivity([
          invited("06:14", "a@x.com"),
          opened("07:00", "a@x.com"),
        ]),
      ),
    ).toEqual(["invite_sent"]);
  });

  it("keeps a lone event as a single row", () => {
    const [item] = groupActivity([responded("08:00", "Ben")]);
    expect(item?.kind).toBe("single");
  });

  it("merges responses that interleave with other groupable events", () => {
    expect(
      shape(
        groupActivity([
          responded("08:00", "Ben"),
          invited("08:30", "a@x.com"),
          responded("09:00", "Cara"),
          invited("09:30", "b@x.com"),
        ]),
      ),
    ).toEqual(["response_created×2", "invite_sent×2"]);
  });

  it("orders groups by their latest event", () => {
    const items = groupActivity([
      invited("08:00", "a@x.com"),
      responded("08:30", "Ben"),
      invited("09:00", "b@x.com"),
      responded("08:45", "Cara"),
    ]);
    expect(shape(items)).toEqual(["response_created×2", "invite_sent×2"]);
  });

  it("keeps a response with a note on its own row", () => {
    expect(
      shape(
        groupActivity([
          responded("08:00", "Ben"),
          responded("08:10", "Priya", "Mornings only"),
          responded("08:20", "Cara"),
        ]),
      ),
    ).toEqual(["response_created", "response_created×2"]);
  });

  it("starts a new group after a gap of more than 12 hours", () => {
    expect(
      shape(
        groupActivity([
          responded("00:00", "Ben"),
          responded("01:00", "Cara"),
          row("13:01", {
            type: "response_created",
            participantId: "Dan",
            payload: { name: "Dan" },
          }),
          responded("13:30", "Eve"),
        ]),
      ),
    ).toEqual(["response_created×2", "response_created×2"]);
  });

  it("never merges across a poll lifecycle event", () => {
    expect(
      shape(
        groupActivity([
          responded("08:00", "Ben"),
          closed("08:30"),
          responded("09:00", "Cara"),
        ]),
      ),
    ).toEqual(["response_created", "poll_closed", "response_created"]);
  });
});
