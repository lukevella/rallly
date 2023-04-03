import { VoteType } from "@rallly/database";
import CheckCircle from "@rallly/icons/check-circle.svg";
import IfNeedBe from "@rallly/icons/if-need-be.svg";
import QuestionMark from "@rallly/icons/question-mark.svg";
import X from "@rallly/icons/x-circle.svg";
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
          className={clsx("text-amber-400", className, {
            "h-5": size === "md",
            "h-3": size === "sm",
          })}
        />
      );

    case "no":
      return (
        <X
          className={clsx("text-slate-400", className, {
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
