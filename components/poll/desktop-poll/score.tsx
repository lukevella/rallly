import clsx from "clsx";
import * as React from "react";

export interface ScoreProps {
  count: number;
  highlight?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const Score: React.VoidFunctionComponent<ScoreProps> = ({
  count,
  highlight,
  style,
  className,
}) => {
  return (
    <div
      className={clsx(
        " z-20 flex h-5 w-5 items-center justify-center rounded-full text-xs shadow-sm shadow-slate-200 transition-colors",
        {
          "bg-rose-500 text-white": highlight,
          "bg-slate-200 text-slate-500": !highlight,
        },
        className,
      )}
      style={style}
    >
      {count}
    </div>
  );
};

export default Score;
