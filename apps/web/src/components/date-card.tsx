import clsx from "clsx";
import * as React from "react";

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
      className={clsx(
        "relative inline-flex size-12 flex-col rounded-md border bg-gray-50 text-center text-slate-800",
        className,
      )}
    >
      <div className="text-muted-foreground border-b border-gray-200 text-xs font-normal leading-4">
        {month}
      </div>
      <div className="flex grow items-center justify-center rounded-b-md bg-white text-lg font-semibold leading-none tracking-tight">
        {day}
      </div>
    </div>
  );
};

export default DateCard;
