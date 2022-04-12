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
        "inline-block font-mono text-xs text-right pr-2 relative after:content-[''] after:absolute after:w-1 after:h-4 after:border-t after:border-r after:border-b after:border-slate-300 after:top-2 after:right-0",
        className,
      )}
    >
      <div>{startTime}</div>
      <div>{endTime}</div>
    </div>
  );
};

export default TimeRange;
