import clsx from "clsx";
import React from "react";

const Badge: React.VoidFunctionComponent<{
  children?: React.ReactNode;
  color?: "gray" | "amber" | "green";
  className?: string;
}> = ({ children, color = "gray", className }) => {
  return (
    <div
      className={clsx(
        "inline-flex h-5 items-center rounded-md px-1 text-xs",
        {
          "bg-slate-200 text-slate-500": color === "gray",
          "bg-amber-100 text-amber-500": color === "amber",
          "bg-green-100/50 text-green-500": color === "green",
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Badge;
