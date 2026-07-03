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
  const { control, setValue, getValues } = useVotingForm();
  const { optionIds } = usePoll();
  const index = optionIds.indexOf(optionId);

  const votes = useWatch({ control, name: "votes" });
  const vote = votes?.[index]?.type;

  const setVote = (newVote: VoteType) => {
    const current = getValues("votes") ?? [];
    const newValue = [...current];
    newValue[index] = { optionId, type: newVote };
    setValue("votes", newValue, { shouldDirty: true });
  };

  return {
    vote,
    setVote,
    cycle: () => setVote(toggleVote(vote)),
  };
}
