"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import * as React from "react";
import { Trans } from "@/components/trans";
import type { ParsedDateTimeOpton } from "@/utils/date-time-utils";

import VoteIcon from "../vote-icon";
import { toggleVote } from "../vote-selector";

export interface DateGroupWithNoneProps {
  dateLabel: string;
  options: ParsedDateTimeOpton[];
  votes: Array<{ optionId: string; type?: VoteType } | undefined>;
  onVotesChange: (optionIds: string[], type: VoteType) => void;
  editable: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DateGroupWithNone({
  dateLabel,
  options,
  votes,
  onVotesChange,
  editable,
  children,
  className,
}: DateGroupWithNoneProps) {
  const noneVote = React.useMemo(() => {
    const allVotes = options.map((opt) => {
      const vote = votes.find((v) => v?.optionId === opt.optionId);
      return vote?.type;
    });
    
    if (allVotes.every((v) => v === "yes")) return "yes";
    if (allVotes.every((v) => v === "ifNeedBe")) return "ifNeedBe";
    if (allVotes.every((v) => v === "no")) return "no";
    
    return undefined;
  }, [options, votes]);

  const handleNoneClick = React.useCallback(() => {
    if (!editable) return;
    
    const nextVote = toggleVote(noneVote);
    const optionIds = options.map((opt) => opt.optionId);
    onVotesChange(optionIds, nextVote);
  }, [editable, noneVote, options, onVotesChange]);

  return (
    <div className={cn("space-y-0", className)}>
      {editable ? (
        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="mb-2 font-medium text-gray-900 text-sm">
            {dateLabel}
          </div>
          <button
            type="button"
            onClick={handleNoneClick}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              {
                "border-green-500 bg-green-50 text-green-700":
                  noneVote === "yes",
                "border-amber-500 bg-amber-50 text-amber-700":
                  noneVote === "ifNeedBe",
                "border-red-500 bg-red-50 text-red-700": noneVote === "no",
                "border-gray-300 bg-white text-gray-600": !noneVote,
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
        </div>
      ) : null}
      <div className="divide-y">{children}</div>
    </div>
  );
}
