"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Checkbox } from "@rallly/ui/checkbox";
import * as React from "react";
import { Trans } from "@/components/trans";
import type { ParsedDateTimeOpton } from "@/utils/date-time-utils";

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
  const allSlotsNo = React.useMemo(() => {
    return options.every((opt) => {
      const vote = votes.find((v) => v?.optionId === opt.optionId);
      return vote?.type === "no";
    });
  }, [options, votes]);

  const [noneChecked, setNoneChecked] = React.useState(allSlotsNo);

  React.useEffect(() => {
    setNoneChecked(allSlotsNo);
  }, [allSlotsNo]);

  const handleNoneChange = (checked: boolean) => {
    if (checked) {
      const optionIds = options.map((opt) => opt.optionId);
      onVotesChange(optionIds, "no");
    }
  };

  return (
    <div className={cn("space-y-0", className)}>
      {editable ? (
        <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-3">
          <Checkbox
            id={`none-${dateLabel}`}
            checked={noneChecked}
            onCheckedChange={handleNoneChange}
          />
          <label
            htmlFor={`none-${dateLabel}`}
            className="flex flex-1 cursor-pointer items-center justify-between text-sm"
          >
            <span className="font-medium">{dateLabel}</span>
            <span className="text-muted-foreground text-xs">
              <Trans i18nKey="noneOption" defaults="None" />
            </span>
          </label>
        </div>
      ) : null}
      <div className="divide-y">{children}</div>
    </div>
  );
}
