import type { VoteType } from "@rallly/database";
import React from "react";
import Image from "next/image";
import { useTranslation } from "@/i18n/client";
import { cn } from "@rallly/ui";

const VoteIcon = ({
  type,
  size = "md",
  className,
}: {
  type?: VoteType;
  size?: "sm" | "md";
  className?: string;
}) => {
  const { t } = useTranslation();
  const iconSize = size === "md" ? 20 : 14;
  switch (type) {
    case "yes":
      return (
        <Image
          className={cn("select-none", className)}
          src="/static/images/yes.svg"
          alt={t("yes")}
          width={iconSize}
          height={iconSize}
        />
      );
    case "ifNeedBe":
      return (
        <Image
          className={cn("select-none", className)}
          src="/static/images/if-need-be.svg"
          alt={t("ifNeedBe")}
          width={iconSize}
          height={iconSize}
        />
      );
    case "no":
      return (
        <Image
          className={cn("select-none", className)}
          src="/static/images/no.svg"
          alt={t("no")}
          width={iconSize}
          height={iconSize}
        />
      );

    default:
      return (
        <Image
          className={cn("select-none", className)}
          src="/static/images/pending.svg"
          alt={t("pending", { defaultValue: "Pending" })}
          width={iconSize}
          height={iconSize}
        />
      );
  }
};

export default VoteIcon;
