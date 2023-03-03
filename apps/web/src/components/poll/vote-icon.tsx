import { VoteType } from "@rallly/database";
import clsx from "clsx";
import * as React from "react";

import CheckCircle from "@/components/icons/check-circle.svg";
import IfNeedBe from "@/components/icons/if-need-be.svg";
import QuestionMark from "@/components/icons/question-mark.svg";
import X from "@/components/icons/x-circle.svg";

const VoteIcon: React.FunctionComponent<{
  type?: VoteType;
  size?: "sm" | "md";
  className?: string;
}> = ({ type, className, size = "md" }) => {
  switch (type) {
    case "yes":
      return (
        <CheckCircle
          className={clsx("text-green-400", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "ifNeedBe":
      return (
        <IfNeedBe
          className={clsx("text-amber-300", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "no":
      return (
        <X
          className={clsx("text-slate-300", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    default:
      return (
        <QuestionMark
          className={clsx("text-slate-300", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );
  }
};

export default VoteIcon;
