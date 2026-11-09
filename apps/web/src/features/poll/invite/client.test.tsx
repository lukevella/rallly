import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBallotState } from "./client";
import type { Ballot } from "./types";

function ballot(overrides: Partial<Ballot> = {}): Ballot {
  return {
    pollId: "p1",
    timeZone: null,
    isDatePoll: false,
    allowTentativeVotes: true,
    requireParticipantEmail: false,
    canRespond: true,
    options: [
      { id: "o1", startTime: "2026-11-18T09:00:00.000Z", duration: 60 },
      { id: "o2", startTime: "2026-11-18T11:00:00.000Z", duration: 60 },
    ],
    tallies: {},
    responseCount: 0,
    ownResponses: [],
    ...overrides,
  };
}

describe("useBallotState", () => {
  it("returns to the thanks bar after a save that changed nothing", () => {
    const saved = ballot({
      ownResponses: [{ id: "r1", name: "Ann", votes: { o1: "yes" } }],
    });
    const { result } = renderHook(() => useBallotState({ ballot: saved }));
    act(() => result.current.startEditing());
    expect(result.current.mode).toBe("edit");
    act(() => result.current.markSaved());
    expect(result.current.mode).toBe("locked");
  });

  it("does not change answers on a poll that no longer accepts responses", () => {
    const { result } = renderHook(() =>
      useBallotState({ ballot: ballot({ canRespond: false }) }),
    );
    expect(result.current.canChange).toBe(false);
    act(() => result.current.setVote("o1", "yes"));
    expect(result.current.answers).toEqual({});
  });

  it("keeps editing and in-progress answers when the response is renamed", () => {
    const votes = { o1: "yes", o2: "no" } as const;
    const { result, rerender } = renderHook(
      ({ data }) => useBallotState({ ballot: data }),
      {
        initialProps: {
          data: ballot({ ownResponses: [{ id: "r1", name: "Ann", votes }] }),
        },
      },
    );
    act(() => result.current.startEditing());
    act(() => result.current.setVote("o2", "yes"));
    rerender({
      data: ballot({ ownResponses: [{ id: "r1", name: "Anna", votes }] }),
    });
    expect(result.current.mode).toBe("edit");
    expect(result.current.answers).toEqual({ o1: "yes", o2: "yes" });
  });

  it("keeps in-progress answers when the same response arrives with votes in another order", () => {
    const first = ballot({
      ownResponses: [{ id: "r1", name: "Ann", votes: { o1: "yes", o2: "no" } }],
    });
    const { result, rerender } = renderHook(
      ({ data }) => useBallotState({ ballot: data }),
      { initialProps: { data: first } },
    );
    act(() => result.current.startEditing());
    act(() => result.current.setVote("o2", "yes"));
    rerender({
      data: ballot({
        ownResponses: [
          { id: "r1", name: "Ann", votes: { o2: "no", o1: "yes" } },
        ],
      }),
    });
    expect(result.current.mode).toBe("edit");
    expect(result.current.answers.o2).toBe("yes");
  });
});
