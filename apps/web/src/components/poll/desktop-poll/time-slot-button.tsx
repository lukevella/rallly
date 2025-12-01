"use client";

import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { useDayjs } from "@/utils/dayjs";

import type { TimeSlotOption } from "../group-by-date";
import VoteIcon from "../vote-icon";
import { VoteSelector } from "../vote-selector";

export interface TimeSlotButtonProps {
  option: TimeSlotOption;
  vote?: VoteType;
  onChange?: (type: VoteType) => void;
  editable: boolean;
  className?: string;
}

export function TimeSlotButton({
  option,
  vote,
  onChange,
  editable,
  className,
}: TimeSlotButtonProps) {
  const { dayjs } = useDayjs();
  const startTime = dayjs(option.startTime).format("LT");
  const endTime = dayjs(option.endTime).format("LT");

  return (
    <div
      className={cn(
        "flex min-w-24 flex-col items-center gap-2 rounded-md border p-3",
        {
          "border-green-200 bg-green-50": vote === "yes",
          "border-amber-200 bg-amber-50": vote === "ifNeedBe",
          "border-gray-200 bg-gray-100": vote === "no" || !vote,
          "border-gray-200 bg-white": !vote && !editable,
        },
        className,
      )}
    >
      <div className="text-center font-medium text-gray-700 text-xs">
        <div>{startTime}</div>
        <div className="text-gray-500">-</div>
        <div>{endTime}</div>
      </div>
      {editable ? (
        <VoteSelector value={vote} onChange={onChange} />
      ) : vote ? (
        <div className="flex size-7 items-center justify-center">
          <VoteIcon type={vote} />
        </div>
      ) : null}
    </div>
  );
}
