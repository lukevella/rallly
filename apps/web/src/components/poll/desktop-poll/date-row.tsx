"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Checkbox } from "@rallly/ui/checkbox";
import * as React from "react";
import { Trans } from "@/components/trans";

import type { DateGroup } from "../group-by-date";
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
  const allSlotsNo = React.useMemo(
    () => dateGroup.options.every((opt) => votes.get(opt.optionId) === "no"),
    [dateGroup.options, votes],
  );

  const [noneChecked, setNoneChecked] = React.useState(allSlotsNo);

  React.useEffect(() => {
    setNoneChecked(allSlotsNo);
  }, [allSlotsNo]);

  const handleNoneChange = (checked: boolean) => {
    if (checked) {
      dateGroup.options.forEach((opt) => {
        onVoteChange(opt.optionId, "no");
      });
    }
  };

  const handleSlotChange = (optionId: string, type: VoteType) => {
    if (type !== "no") {
      setNoneChecked(false);
    }
    onVoteChange(optionId, type);
  };

  return (
    <div className={cn("flex items-start gap-4 border-b py-3", className)}>
      <div className="flex w-48 shrink-0 items-center gap-3">
        <Checkbox
          id={`none-${dateGroup.date}`}
          checked={noneChecked}
          onCheckedChange={handleNoneChange}
          disabled={!editable}
        />
        <label
          htmlFor={`none-${dateGroup.date}`}
          className="flex cursor-pointer flex-col text-sm"
        >
          <span className="font-medium">{dateGroup.displayDate}</span>
          <span className="text-muted-foreground text-xs">
            <Trans i18nKey="noneOption" defaults="None" />
          </span>
        </label>
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
