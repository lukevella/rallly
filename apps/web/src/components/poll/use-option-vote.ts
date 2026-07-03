"use client";

import type { VoteType } from "@rallly/database";
import { useWatch } from "react-hook-form";

import { useVotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/components/poll-context";

import { toggleVote } from "./vote-selector";

/**
 * Reads and writes a single option's vote through the shared voting form,
 * mirroring the index-by-optionId wiring used by the mobile poll options.
 * Returns the current vote plus a `cycle()` helper (yes → ifNeedBe → no) for
 * click-to-cycle surfaces like the calendar grid.
 */
export function useOptionVote(optionId: string) {
  const { control, setValue } = useVotingForm();
  const { optionIds } = usePoll();
  const index = optionIds.indexOf(optionId);

  // Scope the watch/write to this option's slot so a vote only re-renders the
  // clicked card, not every option card sharing the form.
  const vote = useWatch({ control, name: `votes.${index}.type` });

  const setVote = (newVote: VoteType) => {
    if (index === -1) return;
    setValue(
      `votes.${index}`,
      { optionId, type: newVote },
      { shouldDirty: true },
    );
  };

  return {
    vote,
    setVote,
    cycle: () => setVote(toggleVote(vote)),
  };
}
