"use client";
import * as React from "react";
import { useParticipants, usePoll } from "@/features/poll/client";
import type { VoteType } from "@/features/poll/constants";

/**
 * Vote tallies derived from the poll and its participants. These are pure
 * derivations of what `PollProvider` already holds, so they need no
 * provider of their own.
 */
export function usePollScores() {
  const poll = usePoll();
  const { participants } = useParticipants();

  return React.useMemo(() => {
    const scores = new Map<
      string,
      { yes: number; ifNeedBe: number; no: number; skip: number }
    >();
    for (const option of poll.options) {
      scores.set(option.id, { yes: 0, ifNeedBe: 0, no: 0, skip: 0 });
    }
    for (const participant of participants) {
      for (const vote of participant.votes) {
        const score = scores.get(vote.optionId);
        if (!score) {
          continue;
        }
        if (vote.type === "yes") {
          score.yes += 1;
        } else if (vote.type === "ifNeedBe") {
          score.ifNeedBe += 1;
        } else if (vote.type === "no") {
          score.no += 1;
        } else {
          score.skip += 1;
        }
      }
    }

    const empty = { yes: 0, ifNeedBe: 0, no: 0, skip: 0 };
    const getScore = (optionId: string) => scores.get(optionId) ?? empty;

    // Starts at 1 so a single yes never counts as the high score.
    let highScore = 1;
    for (const option of poll.options) {
      const { yes, ifNeedBe } = getScore(option.id);
      highScore = Math.max(highScore, yes + ifNeedBe);
    }

    return {
      poll,
      highScore,
      optionIds: poll.options.map((option) => option.id),
      getScore,
      getVote: (
        participantId: string,
        optionId: string,
      ): VoteType | undefined =>
        participants
          .find((participant) => participant.id === participantId)
          ?.votes.find((vote) => vote.optionId === optionId)?.type,
    };
  }, [poll, participants]);
}
