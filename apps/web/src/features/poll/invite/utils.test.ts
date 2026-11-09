import { describe, expect, it } from "vitest";
import type { BallotSource } from "./types";
import {
  availableCount,
  derivePollInviteStatus,
  getPollInvitePath,
  groupBallotOptions,
  isOptionPast,
  nextVote,
  projectBallot,
} from "./utils";

describe("derivePollInviteStatus", () => {
  it("is sent when nothing has happened", () => {
    expect(
      derivePollInviteStatus({ openedAt: null, participantId: null }),
    ).toBe("sent");
  });

  it("is opened once the invite link was followed", () => {
    expect(
      derivePollInviteStatus({
        openedAt: new Date("2026-09-03T10:00:00Z"),
        participantId: null,
      }),
    ).toBe("opened");
  });

  it("is responded once a participant is joined, even without an open", () => {
    expect(
      derivePollInviteStatus({ openedAt: null, participantId: "p1" }),
    ).toBe("responded");
  });

  it("responded wins over opened", () => {
    expect(
      derivePollInviteStatus({
        openedAt: new Date("2026-09-03T10:00:00Z"),
        participantId: "p1",
      }),
    ).toBe("responded");
  });
});

describe("getPollInvitePath", () => {
  it("builds the per invitee path the email and the host copy share", () => {
    expect(getPollInvitePath({ pollId: "poll1", token: "AbC123" })).toBe(
      "/invite/poll1?token=AbC123",
    );
  });
});

function ballotSource(overrides: Partial<BallotSource> = {}): BallotSource {
  return {
    pollId: "p1",
    status: "open",
    timeZone: "Europe/London",
    hideParticipants: false,
    hideScores: false,
    allowTentativeVotes: true,
    requireParticipantEmail: false,
    options: [
      { id: "o1", startTime: new Date("2026-11-18T09:00:00Z"), duration: 60 },
      { id: "o2", startTime: new Date("2026-11-18T11:00:00Z"), duration: 60 },
    ],
    responses: [
      {
        id: "r1",
        name: "Ann",
        userId: "u1",
        createdAt: new Date("2026-11-02T00:00:00Z"),
        votes: { o1: "yes", o2: "ifNeedBe" },
      },
      {
        id: "r2",
        name: "Bob",
        userId: null,
        createdAt: new Date("2026-11-01T00:00:00Z"),
        votes: { o1: "no", o2: "yes" },
      },
    ],
    ...overrides,
  };
}

const anonymous = { userId: null, linkedResponseIds: [] };

describe("projectBallot", () => {
  it("marks responses owned by session user", () => {
    const ballot = projectBallot({
      source: ballotSource(),
      viewer: { userId: "u1", linkedResponseIds: [] },
    });
    expect(ballot.ownResponses.map((r) => r.id)).toEqual(["r1"]);
  });

  it("marks responses owned by link token", () => {
    const ballot = projectBallot({
      source: ballotSource(),
      viewer: { userId: null, linkedResponseIds: ["r2"] },
    });
    expect(ballot.ownResponses.map((r) => r.id)).toEqual(["r2"]);
  });

  it("puts the response an edit link names ahead of the viewer's newer ones", () => {
    const source = ballotSource();
    const [newest, older] = source.responses;
    if (!newest || !older) throw new Error("expected two responses");
    const ballot = projectBallot({
      source: {
        ...source,
        responses: [
          { ...newest, userId: "u1" },
          { ...older, userId: "u1" },
        ],
      },
      viewer: { userId: "u1", linkedResponseIds: [older.id] },
    });
    expect(ballot.ownResponses.map((r) => r.id)).toEqual([older.id, newest.id]);
  });

  it("tallies yes and if need be with names", () => {
    const ballot = projectBallot({ source: ballotSource(), viewer: anonymous });
    expect(ballot.tallies?.o1).toEqual([
      { responseId: "r1", name: "Ann", vote: "yes" },
    ]);
    expect(ballot.tallies?.o2).toHaveLength(2);
  });

  it("hides other names when participants are hidden", () => {
    const ballot = projectBallot({
      source: ballotSource({ hideParticipants: true }),
      viewer: { userId: "u1", linkedResponseIds: [] },
    });
    expect(ballot.tallies?.o2).toEqual([
      { responseId: "r1", name: "Ann", vote: "ifNeedBe" },
      { responseId: "r2", name: null, vote: "yes" },
    ]);
  });

  it("hides tallies until the viewer responds", () => {
    const source = ballotSource({ hideScores: true });
    expect(projectBallot({ source, viewer: anonymous }).tallies).toBeNull();
    expect(
      projectBallot({
        source,
        viewer: { userId: "u1", linkedResponseIds: [] },
      }).tallies,
    ).not.toBeNull();
  });

  it("leaks nothing when scores and participants are hidden", () => {
    const ballot = projectBallot({
      source: ballotSource({ hideScores: true, hideParticipants: true }),
      viewer: anonymous,
    });
    const payload = JSON.stringify(ballot);
    expect(payload).not.toContain("Ann");
    expect(payload).not.toContain("Bob");
  });

  it("reports date polls and closed polls", () => {
    const ballot = projectBallot({
      source: ballotSource({
        status: "closed",
        options: [
          {
            id: "o1",
            startTime: new Date("2026-11-18T00:00:00Z"),
            duration: 0,
          },
        ],
      }),
      viewer: anonymous,
    });
    expect(ballot.isDatePoll).toBe(true);
    expect(ballot.canRespond).toBe(false);
  });
});

describe("groupBallotOptions", () => {
  const timeSlots = [
    { id: "a", startTime: "2026-11-18T23:30:00.000Z", duration: 60 },
    { id: "b", startTime: "2026-11-19T01:00:00.000Z", duration: 60 },
  ];

  it("groups time slots by the viewer's day", () => {
    expect(
      groupBallotOptions({
        options: timeSlots,
        isDatePoll: false,
        timeZone: "Pacific/Auckland",
      }),
    ).toEqual([{ key: "2026-11-19", optionIds: ["a", "b"] }]);
    expect(
      groupBallotOptions({
        options: timeSlots,
        isDatePoll: false,
        timeZone: "UTC",
      }).map((group) => group.key),
    ).toEqual(["2026-11-18", "2026-11-19"]);
  });

  it("groups dates by month", () => {
    expect(
      groupBallotOptions({
        options: [
          { id: "a", startTime: "2026-11-30T00:00:00.000Z", duration: 0 },
          { id: "b", startTime: "2026-12-01T00:00:00.000Z", duration: 0 },
        ],
        isDatePoll: true,
        timeZone: "Pacific/Auckland",
      }).map((group) => group.key),
    ).toEqual(["2026-11", "2026-12"]);
  });
});

describe("availableCount", () => {
  const entries = [
    { responseId: "r1", name: "Ann", vote: "yes" as const },
    { responseId: "r2", name: "Bob", vote: "ifNeedBe" as const },
  ];

  it("replaces the active response with the live vote", () => {
    expect(
      availableCount({ entries, activeResponseId: "r1", liveVote: "no" }),
    ).toBe(1);
    expect(
      availableCount({ entries, activeResponseId: "r1", liveVote: "yes" }),
    ).toBe(2);
    expect(
      availableCount({ entries, activeResponseId: null, liveVote: "yes" }),
    ).toBe(3);
  });
});

describe("isOptionPast", () => {
  const now = new Date("2026-11-18T12:00:00.000Z");

  it("compares a zoned slot's start with now", () => {
    const base = {
      isDatePoll: false,
      isFloating: false,
      now,
      viewerTimeZone: "UTC",
    };
    expect(
      isOptionPast({ ...base, startTime: "2026-11-18T11:59:00.000Z" }),
    ).toBe(true);
    expect(
      isOptionPast({ ...base, startTime: "2026-11-18T12:30:00.000Z" }),
    ).toBe(false);
  });

  it("reads a floating slot as a wall time in the viewer's zone", () => {
    // 13:00 wall time; it is 07:00 in New York, so still to come there.
    const option = {
      startTime: "2026-11-18T13:00:00.000Z",
      isDatePoll: false,
      isFloating: true,
      now,
    };
    expect(
      isOptionPast({ ...option, viewerTimeZone: "America/New_York" }),
    ).toBe(false);
    // It is 21:00 in Tokyo, so it has passed there.
    expect(isOptionPast({ ...option, viewerTimeZone: "Asia/Tokyo" })).toBe(
      true,
    );
  });

  it("treats a date as past only once that day has ended for the viewer", () => {
    const base = { isDatePoll: true, isFloating: true, now };
    // Already the 19th in Kiritimati, still the 18th in New York.
    expect(
      isOptionPast({
        ...base,
        startTime: "2026-11-18T00:00:00.000Z",
        viewerTimeZone: "Pacific/Kiritimati",
      }),
    ).toBe(true);
    expect(
      isOptionPast({
        ...base,
        startTime: "2026-11-18T00:00:00.000Z",
        viewerTimeZone: "America/New_York",
      }),
    ).toBe(false);
  });
});

describe("nextVote", () => {
  it("cycles yes, if need be, no", () => {
    expect(nextVote(undefined, true)).toBe("yes");
    expect(nextVote("yes", true)).toBe("ifNeedBe");
    expect(nextVote("ifNeedBe", true)).toBe("no");
    expect(nextVote("no", true)).toBe("yes");
  });

  it("skips if need be when the poll disallows it", () => {
    expect(nextVote("yes", false)).toBe("no");
    expect(nextVote("no", false)).toBe("yes");
  });
});
