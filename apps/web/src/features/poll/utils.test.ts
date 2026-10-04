import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildMonthGrid,
  buildTimeGrid,
  classifyOptions,
  filterCommentsForViewer,
  filterParticipantsByVote,
  getFinalizePlanGate,
  getInitialMonth,
  getMonthRange,
  hasHighlightAfter,
  hasHighlightBefore,
  maskParticipantsForViewer,
  rankOptionsByPopularity,
  summarizeNotifySelection,
  timeGridCellKey,
  toAvailabilitySpans,
} from "./utils";

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

  it("ignores votes for options that no longer exist", () => {
    const participants = [{ id: "p1", votes: [vote("gone", "yes")] }];
    const ranked = rankOptionsByPopularity({ options, participants });
    expect(ranked.every((r) => r.votes.yes.length === 0)).toBe(true);
  });
});

describe("getFinalizePlanGate", () => {
  it("lets a pro space notify and mint a meeting", () => {
    expect(
      getFinalizePlanGate({
        tier: "pro",
        conferencing: { provider: "meet" },
      }),
    ).toBeNull();
  });

  it("lets a free space finalize silently without a provider link", () => {
    expect(
      getFinalizePlanGate({
        tier: "hobby",
        conferencing: null,
      }),
    ).toBeNull();
    expect(
      getFinalizePlanGate({
        tier: "hobby",
        conferencing: { provider: "custom" },
      }),
    ).toBeNull();
  });

  it("lets a free space notify participants", () => {
    expect(
      getFinalizePlanGate({
        tier: "hobby",
        conferencing: null,
      }),
    ).toBeNull();
  });

  it("gates Zoom and Teams links on a free space", () => {
    for (const provider of ["zoom", "teams"] as const) {
      expect(
        getFinalizePlanGate({
          tier: "hobby",
          conferencing: { provider },
        }),
      ).toBe("conferencing");
    }
  });

  it("lets a free space mint a Google Meet link", () => {
    expect(
      getFinalizePlanGate({
        tier: "hobby",
        conferencing: { provider: "meet" },
      }),
    ).toBeNull();
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

const resultOption = (id: string, yes: number, ifNeedBe: number) => ({
  id,
  votes: [
    { type: "yes" as const, count: yes },
    { type: "ifNeedBe" as const, count: ifNeedBe },
    { type: "no" as const, count: 0 },
  ],
  score: (yes + ifNeedBe) * 1000 + yes,
});

describe("classifyOptions", () => {
  it("marks every option normal when nobody is available", () => {
    const states = classifyOptions([
      resultOption("a", 0, 0),
      resultOption("b", 0, 0),
    ]);
    expect([...states.values()]).toEqual(["normal", "normal"]);
  });

  it("marks all options tied on score as best", () => {
    const states = classifyOptions([
      resultOption("a", 3, 1),
      resultOption("b", 3, 1),
    ]);
    expect(states.get("a")).toBe("best");
    expect(states.get("b")).toBe("best");
  });

  it("lets yes votes break an availability tie", () => {
    const states = classifyOptions([
      resultOption("a", 4, 0),
      resultOption("b", 2, 2),
    ]);
    expect(states.get("a")).toBe("best");
    expect(states.get("b")).toBe("popular");
  });

  it("treats exactly 75% of the best's availability as popular", () => {
    const states = classifyOptions([
      resultOption("best", 8, 0),
      resultOption("edge", 6, 0),
      resultOption("below", 5, 0),
    ]);
    expect(states.get("edge")).toBe("popular");
    expect(states.get("below")).toBe("normal");
  });

  it("never marks an option without availability as popular", () => {
    const states = classifyOptions([
      resultOption("a", 1, 0),
      resultOption("b", 0, 0),
    ]);
    expect(states.get("a")).toBe("best");
    expect(states.get("b")).toBe("normal");
  });
});

const timeOption = (id: string, iso: string, duration = 60) => ({
  id,
  startTime: new Date(iso),
  duration,
});

describe("buildTimeGrid", () => {
  it("gives overlapping slots their own rows and unions slots across dates", () => {
    const grid = buildTimeGrid({
      timeZone: "UTC",
      options: [
        timeOption("a", "2026-08-24T01:00:00Z"),
        timeOption("b", "2026-08-24T01:30:00Z"),
        timeOption("c", "2026-08-25T01:00:00Z"),
      ],
    });
    expect(grid.dates.map((d) => d.key)).toEqual(["2026-08-24", "2026-08-25"]);
    expect(grid.slots.map((s) => s.key)).toEqual(["60:60", "90:60"]);
    expect(grid.cells.get(timeGridCellKey("2026-08-25", "60:60"))).toBe("c");
    expect(
      grid.cells.get(timeGridCellKey("2026-08-25", "90:60")),
    ).toBeUndefined();
  });

  it("orders slots by start then duration", () => {
    const grid = buildTimeGrid({
      timeZone: "UTC",
      options: [
        timeOption("long", "2026-08-24T09:00:00Z", 90),
        timeOption("short", "2026-08-24T09:00:00Z", 30),
      ],
    });
    expect(grid.slots.map((s) => s.key)).toEqual(["540:30", "540:90"]);
  });

  it("groups by date in the display zone", () => {
    const grid = buildTimeGrid({
      timeZone: "Asia/Tokyo",
      options: [timeOption("a", "2026-08-24T23:00:00Z")],
    });
    expect(grid.dates[0]?.key).toBe("2026-08-25");
    expect(grid.slots[0]?.startMinutes).toBe(8 * 60);
  });

  it("keeps an option crossing midnight in its start date's column", () => {
    const grid = buildTimeGrid({
      timeZone: "UTC",
      options: [timeOption("late", "2026-08-27T23:30:00Z", 60)],
    });
    expect(grid.dates.map((d) => d.key)).toEqual(["2026-08-27"]);
    expect(grid.slots[0]?.key).toBe("1410:60");
  });

  it("marks skipped days and time jumps of two hours or more", () => {
    const grid = buildTimeGrid({
      timeZone: "UTC",
      options: [
        timeOption("a", "2026-08-27T01:00:00Z"),
        timeOption("b", "2026-08-28T02:30:00Z"),
        timeOption("c", "2026-08-31T21:00:00Z"),
      ],
    });
    expect([...grid.dateGapBefore]).toEqual([2]);
    expect([...grid.slotGapBefore]).toEqual([2]);
  });
});

describe("buildMonthGrid", () => {
  it("pads leading and trailing days to full weeks", () => {
    // Sept 2026 starts on a Tuesday.
    const weeks = buildMonthGrid({ monthKey: "2026-09", weekStart: 1 });
    expect(weeks[0]?.[0]).toBeNull();
    expect(weeks[0]?.[1]).toEqual({ dateKey: "2026-09-01", day: 1 });
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it("has no leading blanks when the month starts on the week start", () => {
    // Nov 2026 starts on a Sunday.
    const weeks = buildMonthGrid({ monthKey: "2026-11", weekStart: 0 });
    expect(weeks[0]?.[0]).toEqual({ dateKey: "2026-11-01", day: 1 });
  });
});

describe("month navigation helpers", () => {
  const options = [
    { id: "a", startTime: new Date("2026-08-30T00:00:00Z") },
    { id: "b", startTime: new Date("2026-09-03T00:00:00Z") },
    { id: "c", startTime: new Date("2026-10-12T00:00:00Z") },
  ];

  it("adds months across years", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("bounds navigation to months with options", () => {
    expect(getMonthRange(options)).toEqual({
      first: "2026-08",
      last: "2026-10",
    });
    expect(getMonthRange(options.slice(1, 2))).toEqual({
      first: "2026-09",
      last: "2026-09",
    });
  });

  it("opens on the first best option's month, else the first option's", () => {
    const states = new Map([
      ["a", "normal" as const],
      ["b", "best" as const],
      ["c", "best" as const],
    ]);
    expect(getInitialMonth({ options, states })).toBe("2026-09");
    expect(getInitialMonth({ options, states: new Map() })).toBe("2026-08");
  });

  it("reports highlights on either side of the current month", () => {
    const states = new Map([
      ["a", "popular" as const],
      ["b", "best" as const],
      ["c", "normal" as const],
    ]);
    expect(hasHighlightBefore({ monthKey: "2026-09", options, states })).toBe(
      true,
    );
    expect(hasHighlightAfter({ monthKey: "2026-09", options, states })).toBe(
      false,
    );
  });
});
