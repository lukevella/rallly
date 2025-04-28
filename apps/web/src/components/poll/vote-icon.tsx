import type { VoteType } from "@rallly/database";
import React from "react";
import YesIcon from "@/assets/yes.svg";
import IfNeedBeIcon from "@/assets/if-need-be.svg";
import NoIcon from "@/assets/no.svg";
import PendingIcon from "@/assets/pending.svg";

const VoteIcon = ({
  type,
  size = "md",
  className,
}: {
  type?: VoteType;
  size?: "sm" | "md";
  className?: string;
}) => {
  const iconSize = size === "md" ? 20 : 14;
  switch (type) {
    case "yes":
      return (
        <YesIcon className={className} width={iconSize} height={iconSize} />
      );
    case "ifNeedBe":
      return (
        <IfNeedBeIcon
          className={className}
          width={iconSize}
          height={iconSize}
        />
      );
    case "no":
      return (
        <NoIcon className={className} width={iconSize} height={iconSize} />
      );

    default:
      return (
        <PendingIcon className={className} width={iconSize} height={iconSize} />
      );
  }
};

export default VoteIcon;
