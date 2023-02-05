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
        "relative inline-flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-center",
        className,
      )}
    >
      {annotation ? (
        <div className="absolute -top-3 -right-3 z-20">{annotation}</div>
      ) : null}
      <div>
        <div className="text-center text-xs font-semibold uppercase leading-normal text-slate-500">
          {month}
        </div>
        <div className="text-center text-xl font-bold leading-none">{day}</div>
      </div>
    </div>
  );
};

export default DateCard;
