import { describe, expect, it } from "vitest";
import {
  filterCommentsForViewer,
  filterParticipantsByVote,
  maskParticipantsForViewer,
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
