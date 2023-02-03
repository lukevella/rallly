import clsx from "clsx";
import * as React from "react";

export interface DateCardProps {
  annotation?: React.ReactNode;
  day: string;
  month: string;
  className?: string;
}

const DateCard: React.VoidFunctionComponent<DateCardProps> = ({
  annotation,
  className,
  day,
  month,
}) => {
  return (
    <div
      className={clsx(
        "relative inline-block rounded-md border border-slate-200 px-4 py-1 text-center",
        className,
      )}
    >
      {annotation ? (
        <div className="absolute -top-3 -right-3 z-20">{annotation}</div>
      ) : null}
      <div className="text-center text-lg font-bold">{day}</div>
      <div className="text-center text-xs font-semibold uppercase text-slate-500">
        {month}
      </div>
    </div>
  );
};

export default DateCard;
