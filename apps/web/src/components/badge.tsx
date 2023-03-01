import clsx from "clsx";
import React from "react";

const Badge: React.FunctionComponent<{
  children?: React.ReactNode;
  color?: "gray" | "amber" | "green" | "red" | "blue";
  className?: string;
}> = ({ children, color = "gray", className }) => {
  return (
    <div
      className={clsx(
        "inline-flex h-5 cursor-default items-center rounded-md px-1 text-xs lg:text-sm",
        {
          "bg-slate-200 text-slate-500": color === "gray",
          "bg-amber-100 text-amber-500": color === "amber",
          "bg-green-100/50 text-green-500": color === "green",
          "bg-rose-100/50 text-rose-500": color === "red",
          "bg-cyan-100/50 text-cyan-500": color === "blue",
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Badge;
