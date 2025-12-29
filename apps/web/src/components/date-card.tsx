import { cn } from "@rallly/ui";
import type * as React from "react";

export interface DateCardProps {
  day: string;
  dow?: string;
  month: string;
  className?: string;
}

const DateCard: React.FunctionComponent<DateCardProps> = ({
  className,
  day,
  month,
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex size-12 flex-col rounded-lg border bg-card text-center text-card-foreground",
        className,
      )}
    >
      <div className="border-b font-normal text-muted-foreground text-xs leading-4">
        {month}
      </div>
      <div className="flex grow items-center justify-center rounded-b-md font-semibold text-lg leading-none tracking-tight">
        {day}
      </div>
    </div>
  );
};

export default DateCard;
