import { describe, expect, it } from "vitest";
import type { PollDetails } from "./types";
import {
  filterCommentsForViewer,
  filterParticipantsByVote,
  getChosenOptionRank,
  getFinalizeTiming,
  hasPastPollOptions,
  isPollFormOptionPast,
  isPollOptionPast,
  maskParticipantsForViewer,
  rankOptionsByPopularity,
  resolveNotifyParticipantIds,
  summarizeNotifySelection,
  toAvailabilitySpans,
  withholdAggregateScores,
} from "./utils";

describe("isPollOptionPast", () => {
  const now = new Date("2026-10-29T01:00:00Z");

  it("uses the viewer's calendar date for all-day options", () => {
    const option = { startTime: new Date("2026-10-28T00:00:00Z"), duration: 0 };

    expect(isPollOptionPast({ option, now, timeZone: "UTC" })).toBe(true);
    expect(
      isPollOptionPast({ option, now, timeZone: "America/Los_Angeles" }),
    ).toBe(false);
  });

  it("keeps an all-day option votable for its full calendar date", () => {
    const option = { startTime: new Date("2026-10-29T00:00:00Z"), duration: 0 };

    expect(isPollOptionPast({ option, now, timeZone: "UTC" })).toBe(false);
  });

  it("considers a time option past once its start time is reached", () => {
    const option = {
      startTime: new Date("2026-10-29T00:30:00Z"),
      duration: 120,
    };

    expect(
      isPollOptionPast({
        option,
        now: new Date("2026-10-29T00:29:59.999Z"),
        timeZone: "UTC",
      }),
    ).toBe(false);
    expect(isPollOptionPast({ option, now, timeZone: "UTC" })).toBe(true);
  });
});

describe("isPollFormOptionPast", () => {
  it("uses the supplied timezone for floating date options", () => {
    const option = { type: "date" as const, date: "2026-10-28" };
    const now = new Date("2026-10-29T01:00:00Z");

    expect(isPollFormOptionPast({ option, now, timeZone: "UTC" })).toBe(true);
    expect(
      isPollFormOptionPast({
        option,
        now,
        timeZone: "America/Los_Angeles",
      }),
    ).toBe(false);
  });

  it("compares a time option in its selected timezone", () => {
    const option = {
      type: "timeSlot" as const,
      start: "2026-10-29T08:30:00",
      end: "2026-10-29T09:30:00",
    };

    expect(
      isPollFormOptionPast({
        option,
        now: new Date("2026-10-29T12:29:59.999Z"),
        timeZone: "America/New_York",
      }),
    ).toBe(false);
    expect(
      isPollFormOptionPast({
        option,
        now: new Date("2026-10-29T12:30:00Z"),
        timeZone: "America/New_York",
      }),
    ).toBe(true);
  });
});

describe("hasPastPollOptions", () => {
  it("finds all-day and timed options that have passed", () => {
    const now = new Date("2026-10-29T12:00:00Z");

    expect(
      hasPastPollOptions({
        options: [
          { startTime: new Date("2026-10-28T00:00:00Z"), duration: 0 },
          { startTime: new Date("2026-10-29T11:30:00Z"), duration: 60 },
        ],
        now,
        timeZone: "UTC",
      }),
    ).toBe(true);
    expect(
      hasPastPollOptions({
        options: [
          { startTime: new Date("2026-10-29T12:30:00Z"), duration: 60 },
        ],
        now,
        timeZone: "UTC",
      }),
    ).toBe(false);
    expect(
      hasPastPollOptions({
        options: [
          { startTime: new Date("2026-10-29T12:30:00Z"), duration: 60 },
          { startTime: new Date("2026-10-28T00:00:00Z"), duration: 0 },
        ],
        now,
        timeZone: "UTC",
      }),
    ).toBe(true);
  });
});

const participant = (
  id: string,
  overrides: Partial<{
    userId: string | null;
    note: string | null;
    email: string | null;
  }> = {},
) => ({
  id,
  name: `Name ${id}`,
  email: overrides.email ?? `${id}@example.com`,
  userId: overrides.userId ?? null,
  note: overrides.note ?? `Note ${id}`,
  image: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  token: `token-${id}`,
  votes: [{ optionId: "opt-1", type: "yes" as const }],
});

describe("maskParticipantsForViewer", () => {
  it("keeps notes only for the viewer's own responses", () => {
    const result = maskParticipantsForViewer({
      participants: [
        participant("a", { userId: "user-1" }),
        participant("b", { userId: "user-2" }),
        participant("c"),
      ],
      viewer: { userId: "user-1", linkedParticipantIds: ["c"] },
      hideParticipants: false,
    });

    expect(result.map((p) => p.note)).toEqual(["Note a", null, "Note c"]);
  });

  it("never exposes the edit token or an edit link", () => {
    const [result] = maskParticipantsForViewer({
      participants: [participant("a")],
      viewer: { userId: null, linkedParticipantIds: [] },
      hideParticipants: false,
    });

    expect(result).not.toHaveProperty("token");
    expect(result.editUrl).toBeNull();
    expect(result.hidden).toBe(false);
  });

  it("withholds identity of other participants when hidden", () => {
    const result = maskParticipantsForViewer({
      participants: [
        participant("a", { userId: "user-1" }),
        participant("b", { userId: "user-2" }),
      ],
      viewer: { userId: "user-1", linkedParticipantIds: [] },
      hideParticipants: true,
    });

    expect(result[0]).toMatchObject({
      name: "Name a",
      email: "a@example.com",
      userId: "user-1",
      hidden: false,
    });
    expect(result[1]).toMatchObject({
      name: "",
      email: null,
      userId: null,
      image: null,
      note: null,
      hidden: true,
    });
    expect(result[1].votes).toEqual([{ optionId: "opt-1", type: "yes" }]);
  });

  it("returns only the viewer's responses when aggregate results are enabled", () => {
    const result = maskParticipantsForViewer({
      participants: [
        participant("a", { userId: "user-1" }),
        participant("b", { userId: "user-2" }),
      ],
      viewer: { userId: "user-1", linkedParticipantIds: [] },
      hideParticipants: false,
      aggregateResultsOnly: true,
    });

    expect(result.map(({ id }) => id)).toEqual(["a"]);
  });

  it("returns no individual responses to an unlinked anonymous viewer in aggregate mode", () => {
    expect(
      maskParticipantsForViewer({
        participants: [participant("a"), participant("b")],
        viewer: { userId: null, linkedParticipantIds: [] },
        hideParticipants: false,
        aggregateResultsOnly: true,
      }),
    ).toEqual([]);
  });

  it("keeps a guest's linked response editable in aggregate mode", () => {
    const result = maskParticipantsForViewer({
      participants: [participant("a"), participant("b")],
      viewer: { userId: null, linkedParticipantIds: ["b"] },
      hideParticipants: true,
      aggregateResultsOnly: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "b",
      name: "Name b",
      note: "Note b",
      hidden: false,
      votes: [{ optionId: "opt-1", type: "yes" }],
    });
    expect(result[0]).not.toHaveProperty("token");
  });
});

describe("filterCommentsForViewer", () => {
  const comments = [
    {
      id: "1",
      content: "a",
      authorName: "A",
      userId: "user-1",
      createdAt: new Date(),
    },
    {
      id: "2",
      content: "b",
      authorName: "B",
      userId: "user-2",
      createdAt: new Date(),
    },
  ];

  it("returns every comment when participants are visible", () => {
    expect(
      filterCommentsForViewer({
        comments,
        viewerUserId: null,
        hideParticipants: false,
      }),
    ).toHaveLength(2);
  });

  it("returns nothing to an anonymous viewer when participants are hidden", () => {
    expect(
      filterCommentsForViewer({
        comments,
        viewerUserId: null,
        hideParticipants: true,
      }),
    ).toEqual([]);
  });

  it("returns only the viewer's comments when participants are hidden", () => {
    expect(
      filterCommentsForViewer({
        comments,
        viewerUserId: "user-2",
        hideParticipants: true,
      }).map((c) => c.id),
    ).toEqual(["2"]);
  });
});

describe("filterParticipantsByVote", () => {
  it("keeps participants who cast the given vote on the option", () => {
    const result = filterParticipantsByVote(
      [
        { id: "a", votes: [{ optionId: "opt-1", type: "yes" as const }] },
        { id: "b", votes: [{ optionId: "opt-1", type: "no" as const }] },
      ],
      "opt-1",
      "yes",
    );
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });
});

describe("toAvailabilitySpans", () => {
  const at = (iso: string) => new Date(iso);

  it("drops no, makes ifNeedBe a modifier, and orders by option start", () => {
    expect(
      toAvailabilitySpans({
        kind: "time",
        votes: [
          {
            type: "no",
            option: { startTime: at("2026-10-03T09:00:00Z"), duration: 30 },
          },
          {
            type: "ifNeedBe",
            option: { startTime: at("2026-10-02T09:00:00Z"), duration: 45 },
          },
          {
            type: "yes",
            option: { startTime: at("2026-10-01T09:00:00Z"), duration: 30 },
          },
        ],
      }),
    ).toEqual([
      {
        start: "2026-10-01T09:00:00.000Z",
        end: "2026-10-01T09:30:00.000Z",
        allDay: false,
        modifiers: [],
      },
      {
        start: "2026-10-02T09:00:00.000Z",
        end: "2026-10-02T09:45:00.000Z",
        allDay: false,
        modifiers: ["ifNeedBe"],
      },
    ]);
  });

  it("spans the whole UTC day for a date poll", () => {
    expect(
      toAvailabilitySpans({
        kind: "date",
        votes: [
          {
            type: "yes",
            option: { startTime: at("2026-10-01T00:00:00Z"), duration: 0 },
          },
        ],
      }),
    ).toEqual([
      {
        start: "2026-10-01T00:00:00.000Z",
        end: "2026-10-02T00:00:00.000Z",
        allDay: true,
        modifiers: [],
      },
    ]);
  });
});

describe("rankOptionsByPopularity", () => {
  const options = [
    { id: "a", startTime: new Date("2026-03-01T10:00:00Z"), duration: 60 },
    { id: "b", startTime: new Date("2026-03-02T10:00:00Z"), duration: 60 },
    { id: "c", startTime: new Date("2026-03-03T10:00:00Z"), duration: 60 },
  ];
  const vote = (optionId: string, type: "yes" | "ifNeedBe" | "no") => ({
    optionId,
    type,
  });

  it("orders by yes plus ifNeedBe, then yes, then ifNeedBe", () => {
    const participants = [
      {
        id: "p1",
        votes: [vote("a", "no"), vote("b", "yes"), vote("c", "yes")],
      },
      {
        id: "p2",
        votes: [vote("a", "yes"), vote("b", "ifNeedBe"), vote("c", "yes")],
      },
      {
        id: "p3",
        votes: [vote("a", "yes"), vote("b", "yes"), vote("c", "no")],
      },
    ];

    const ranked = rankOptionsByPopularity({ options, participants });

    expect(ranked.map((r) => r.id)).toEqual(["b", "a", "c"]);
    expect(ranked[0].votes).toEqual({
      yes: ["p1", "p3"],
      ifNeedBe: ["p2"],
      no: [],
    });
  });

  it("keeps option order for ties", () => {
    const ranked = rankOptionsByPopularity({ options, participants: [] });
    expect(ranked.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("ranks aggregate results without individual responses", () => {
    const scores = new Map([
      ["a", { yes: 2, ifNeedBe: 1 }],
      ["b", { yes: 4, ifNeedBe: 0 }],
      ["c", { yes: 3, ifNeedBe: 0 }],
    ]);
    const ranked = rankOptionsByPopularity({
      options,
      participants: [],
      /** Aggregate totals stand in for the missing responses. */
      getScore: (optionId) => scores.get(optionId) ?? { yes: 0, ifNeedBe: 0 },
    });

    expect(ranked.map(({ id }) => id)).toEqual(["b", "c", "a"]);
    expect(ranked.every(({ votes }) => votes.yes.length === 0)).toBe(true);
  });

  it("ignores votes for options that no longer exist", () => {
    const participants = [{ id: "p1", votes: [vote("gone", "yes")] }];
    const ranked = rankOptionsByPopularity({ options, participants });
    expect(ranked.every((r) => r.votes.yes.length === 0)).toBe(true);
  });
});

describe("getChosenOptionRank", () => {
  const options = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const participants = [
    {
      id: "p1",
      votes: [
        { optionId: "a", type: "yes" as const },
        { optionId: "b", type: "yes" as const },
        { optionId: "c", type: "no" as const },
      ],
    },
  ];

  it("ranks a joint winner first and tied", () => {
    expect(
      getChosenOptionRank({ options, participants, optionId: "b" }),
    ).toEqual({ chosen_rank: 1, chosen_tied: true, option_count: 3 });
  });

  it("ranks an option below the winners after all of them", () => {
    expect(
      getChosenOptionRank({ options, participants, optionId: "c" }),
    ).toEqual({ chosen_rank: 3, chosen_tied: false, option_count: 3 });
  });

  it("returns no rank for an option that is not in the poll", () => {
    expect(
      getChosenOptionRank({ options, participants, optionId: "gone" }),
    ).toEqual({ chosen_rank: null, chosen_tied: false, option_count: 3 });
  });
});

describe("getFinalizeTiming", () => {
  const now = new Date("2026-10-13T12:00:00Z");

  it("counts hours ahead for a zoned time", () => {
    expect(
      getFinalizeTiming({
        start: new Date("2026-10-14T12:00:00Z"),
        end: new Date("2026-10-14T13:00:00Z"),
        allDay: false,
        timeZone: "Europe/London",
        now,
      }),
    ).toEqual({ hours_to_start: 24, is_past: false, floating_time: false });
  });

  it("marks a zoned time past as soon as it starts", () => {
    expect(
      getFinalizeTiming({
        start: new Date("2026-10-13T11:00:00Z"),
        end: new Date("2026-10-13T12:00:00Z"),
        allDay: false,
        timeZone: "Europe/London",
        now,
      }).is_past,
    ).toBe(true);
  });

  it("keeps a floating time open until it has passed in every zone", () => {
    const timing = getFinalizeTiming({
      start: new Date("2026-10-13T11:00:00Z"),
      end: new Date("2026-10-13T12:00:00Z"),
      allDay: false,
      timeZone: null,
      now,
    });
    expect(timing.is_past).toBe(false);
    expect(timing.floating_time).toBe(true);
  });

  it("treats today's all-day date as not past", () => {
    expect(
      getFinalizeTiming({
        start: new Date("2026-10-13T00:00:00Z"),
        end: new Date("2026-10-14T00:00:00Z"),
        allDay: true,
        timeZone: null,
        now,
      }).is_past,
    ).toBe(false);
  });

  it("treats an all-day date that ended everywhere as past", () => {
    expect(
      getFinalizeTiming({
        start: new Date("2026-10-11T00:00:00Z"),
        end: new Date("2026-10-12T00:00:00Z"),
        allDay: true,
        timeZone: null,
        now,
      }).is_past,
    ).toBe(true);
  });
});

describe("summarizeNotifySelection", () => {
  const voter = (
    id: string,
    type: "yes" | "ifNeedBe" | "no" | null,
    email: string | null = `${id}@example.com`,
  ) => ({
    id,
    email,
    votes: type ? [{ optionId: "opt-1", type }] : [],
  });

  const participants = [
    voter("a", "yes"),
    voter("b", "yes"),
    voter("c", "ifNeedBe"),
    voter("d", "no"),
    voter("e", null),
    voter("f", "yes", null),
  ];

  it("counts eligible and selected participants by vote", () => {
    expect(
      summarizeNotifySelection({
        participants,
        optionId: "opt-1",
        notifyParticipantIds: ["a", "c"],
      }),
    ).toEqual({
      notify_eligible_yes: 2,
      notify_eligible_if_need_be: 1,
      notify_eligible_no: 1,
      notify_eligible_no_response: 1,
      notify_selected_yes: 1,
      notify_selected_if_need_be: 1,
      notify_selected_no: 0,
      notify_selected_no_response: 0,
      notify_selection_changed: true,
    });
  });

  it("reports an untouched selection when everyone with an email is selected", () => {
    const summary = summarizeNotifySelection({
      participants,
      optionId: "opt-1",
      notifyParticipantIds: ["a", "b", "c", "d", "e"],
    });
    expect(summary.notify_selection_changed).toBe(false);
  });

  it("ignores participants without an email even when selected", () => {
    const summary = summarizeNotifySelection({
      participants,
      optionId: "opt-1",
      notifyParticipantIds: ["a", "b", "c", "d", "e", "f"],
    });
    expect(summary.notify_selected_yes).toBe(2);
    expect(summary.notify_selection_changed).toBe(false);
  });

  it("counts participants sharing an address under their own vote", () => {
    const summary = summarizeNotifySelection({
      participants: [
        voter("h", "yes", "Shared@example.com"),
        voter("i", "no", "shared@example.com"),
      ],
      optionId: "opt-1",
      notifyParticipantIds: ["h"],
    });
    expect(summary.notify_selected_yes).toBe(1);
    expect(summary.notify_selected_no).toBe(0);
    expect(summary.notify_selection_changed).toBe(true);
  });

  it("buckets votes on other options as no response", () => {
    const summary = summarizeNotifySelection({
      participants: [
        {
          id: "g",
          email: "g@example.com",
          votes: [{ optionId: "opt-2", type: "yes" as const }],
        },
      ],
      optionId: "opt-1",
      notifyParticipantIds: ["g"],
    });
    expect(summary.notify_eligible_no_response).toBe(1);
    expect(summary.notify_selected_no_response).toBe(1);
  });
});

describe("resolveNotifyParticipantIds", () => {
  const participants = [
    { id: "a", email: "a@example.com" },
    { id: "b", email: "b@example.com" },
    { id: "c", email: null },
  ];

  it("notifies only the selected participants", () => {
    expect(
      resolveNotifyParticipantIds({
        participants,
        notifyParticipantIds: ["b"],
        notifyAllParticipants: false,
        aggregateResultsOnly: false,
      }),
    ).toEqual(["b"]);
  });

  it("notifies everyone with an email when asked to notify all", () => {
    expect(
      resolveNotifyParticipantIds({
        participants,
        notifyParticipantIds: [],
        notifyAllParticipants: true,
        aggregateResultsOnly: false,
      }),
    ).toEqual(["a", "b"]);
  });

  it("skips selected participants without an email", () => {
    expect(
      resolveNotifyParticipantIds({
        participants,
        notifyParticipantIds: ["c"],
        notifyAllParticipants: false,
        aggregateResultsOnly: false,
      }),
    ).toEqual([]);
  });

  it("ignores explicit ids on an aggregate results poll", () => {
    expect(
      resolveNotifyParticipantIds({
        participants,
        notifyParticipantIds: ["a"],
        notifyAllParticipants: false,
        aggregateResultsOnly: true,
      }),
    ).toEqual([]);
  });

  it("notifies everyone with an email on an aggregate poll when asked", () => {
    expect(
      resolveNotifyParticipantIds({
        participants,
        notifyParticipantIds: ["a"],
        notifyAllParticipants: true,
        aggregateResultsOnly: true,
      }),
    ).toEqual(["a", "b"]);
  });

  it("ignores ids that are not participants of the poll", () => {
    expect(
      resolveNotifyParticipantIds({
        participants,
        notifyParticipantIds: ["other"],
        notifyAllParticipants: false,
        aggregateResultsOnly: false,
      }),
    ).toEqual([]);
  });
});

describe("withholdAggregateScores", () => {
  const totals = { optionId: "opt-1", yes: 2, ifNeedBe: 1, no: 1, skip: 0 };
  const poll = (overrides: Partial<PollDetails>) =>
    ({
      aggregateResultsOnly: true,
      hideScores: true,
      aggregateVotes: [totals],
      ...overrides,
    }) as PollDetails;

  it("zeroes the totals for a viewer who has not responded", () => {
    expect(
      withholdAggregateScores({ poll: poll({}), viewerHasResponded: false })
        .aggregateVotes,
    ).toEqual([{ optionId: "opt-1", yes: 0, ifNeedBe: 0, no: 0, skip: 0 }]);
  });

  it("keeps the totals once the viewer has responded", () => {
    const input = poll({});
    expect(
      withholdAggregateScores({ poll: input, viewerHasResponded: true }),
    ).toBe(input);
  });

  it("keeps the totals when scores are not hidden", () => {
    const input = poll({ hideScores: false });
    expect(
      withholdAggregateScores({ poll: input, viewerHasResponded: false }),
    ).toBe(input);
  });

  it("leaves polls that are not aggregate unchanged", () => {
    const input = poll({ aggregateResultsOnly: false });
    expect(
      withholdAggregateScores({ poll: input, viewerHasResponded: false }),
    ).toBe(input);
  });
});
