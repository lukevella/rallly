"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import * as React from "react";
import { Trans } from "@/components/trans";

import type { DateGroup } from "../group-by-date";
import VoteIcon from "../vote-icon";
import { toggleVote } from "../vote-selector";
import { TimeSlotButton } from "./time-slot-button";

export interface DateRowProps {
  dateGroup: DateGroup;
  votes: Map<string, VoteType>;
  onVoteChange: (optionId: string, type: VoteType) => void;
  editable: boolean;
  className?: string;
}

export function DateRow({
  dateGroup,
  votes,
  onVoteChange,
  editable,
  className,
}: DateRowProps) {
  const noneVote = React.useMemo(() => {
    const allVotes = dateGroup.options.map((opt) => votes.get(opt.optionId));
    
    if (allVotes.every((v) => v === "yes")) return "yes";
    if (allVotes.every((v) => v === "ifNeedBe")) return "ifNeedBe";
    if (allVotes.every((v) => v === "no")) return "no";
    
    return undefined;
  }, [dateGroup.options, votes]);

  const handleNoneClick = React.useCallback(() => {
    if (!editable) return;
    
    const nextVote = toggleVote(noneVote);
    
    dateGroup.options.forEach((opt) => {
      onVoteChange(opt.optionId, nextVote);
    });
  }, [editable, noneVote, dateGroup.options, onVoteChange]);

  const handleSlotChange = React.useCallback(
    (optionId: string, type: VoteType) => {
      onVoteChange(optionId, type);
    },
    [onVoteChange],
  );

  return (
    <div className={cn("border-b py-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium text-gray-900 text-sm">
          {dateGroup.displayDate}
        </div>
        {editable ? (
          <button
            type="button"
            onClick={handleNoneClick}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              {
                "border-green-500 bg-green-50 text-green-700 hover:bg-green-100":
                  noneVote === "yes",
                "border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100":
                  noneVote === "ifNeedBe",
                "border-red-500 bg-red-50 text-red-700 hover:bg-red-100":
                  noneVote === "no",
                "border-gray-300 bg-white text-gray-600 hover:bg-gray-50":
                  !noneVote,
              },
            )}
          >
            <div className="flex size-5 items-center justify-center">
              <VoteIcon type={noneVote} size="sm" />
            </div>
            <span className="font-medium">
              {noneVote === "yes" ? (
                <Trans i18nKey="allDay" defaults="All day" />
              ) : noneVote === "ifNeedBe" ? (
                <Trans i18nKey="allDayIfNeeded" defaults="All day if needed" />
              ) : noneVote === "no" ? (
                <Trans i18nKey="notThisDay" defaults="Not this day" />
              ) : (
                <Trans i18nKey="selectAllTimes" defaults="Select all times" />
              )}
            </span>
          </button>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {dateGroup.options.map((option) => (
          <TimeSlotButton
            key={option.optionId}
            option={option}
            vote={votes.get(option.optionId)}
            onChange={(type) => handleSlotChange(option.optionId, type)}
            editable={editable}
          />
        ))}
      </div>
    </div>
  );
}
