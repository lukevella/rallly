"use client";

import type { VoteType } from "@rallly/database";
import { VoteIcon as BaseVoteIcon } from "@rallly/ui/vote-icon";
import { useTranslation } from "@/i18n/client";

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

  const title = type
    ? {
        yes: t("yes", { defaultValue: "Yes" }),
        ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
        no: t("no", { defaultValue: "No" }),
      }[type]
    : t("pending", { defaultValue: "Pending" });

  return (
    <BaseVoteIcon
      type={type ?? "pending"}
      size={size}
      title={title}
      className={className}
    />
  );
};

export default VoteIcon;
