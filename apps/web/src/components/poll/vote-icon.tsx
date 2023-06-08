import { VoteType } from "@rallly/database";
import { IfNeedBeIcon, NoIcon, PendingIcon, YesIcon } from "@rallly/icons";
import clsx from "clsx";
import * as React from "react";

const VoteIcon: React.FunctionComponent<{
  type?: VoteType;
  size?: "sm" | "md";
  className?: string;
}> = ({ type, className, size = "md" }) => {
  switch (type) {
    case "yes":
      return (
        <YesIcon
          className={clsx("text-green-500", className, {
            "h-5 w-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "ifNeedBe":
      return (
        <IfNeedBeIcon
          className={clsx("text-amber-400", className, {
            "h-5 w-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "no":
      return (
        <NoIcon
          className={clsx("text-gray-400", className, {
            "h-5 w-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    default:
      return (
        <PendingIcon
          className={clsx("text-gray-300", className, {
            "h-5 w-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );
  }
};

export default VoteIcon;
