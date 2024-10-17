import { VoteType } from "@rallly/database";
import { IfNeedBeIcon, NoIcon, PendingIcon, YesIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
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
          className={cn("text-green-500", className, {
            "size-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "ifNeedBe":
      return (
        <IfNeedBeIcon
          className={cn("text-amber-400", className, {
            "size-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "no":
      return (
        <NoIcon
          className={cn("text-gray-400", className, {
            "size-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    default:
      return (
        <PendingIcon
          className={cn("text-gray-300", className, {
            "size-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );
  }
};

export default VoteIcon;
