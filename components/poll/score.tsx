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
        " rounded-full text-xs w-5 h-5 flex justify-center items-center shadow-slate-200 shadow-sm transition-colors z-20",
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
