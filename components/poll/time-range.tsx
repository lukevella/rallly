import clsx from "clsx";
import * as React from "react";

export interface TimeRangeProps {
  startTime: string;
  endTime: string;
  className?: string;
}

const TimeRange: React.VoidFunctionComponent<TimeRangeProps> = ({
  startTime,
  endTime,
  className,
}) => {
  return (
    <div
      className={clsx(
        "relative inline-block pr-2 text-right font-mono text-xs after:absolute after:top-2 after:right-0 after:h-4 after:w-1 after:border-t after:border-r after:border-b after:border-slate-300 after:content-['']",
        className,
      )}
    >
      <div>{startTime}</div>
      <div>{endTime}</div>
    </div>
  );
};

export default TimeRange;
