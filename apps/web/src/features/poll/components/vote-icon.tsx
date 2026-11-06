"use client";

import type { VoteType } from "@rallly/database";
import {
  AnimatedVoteIcon,
  VoteIcon as BaseVoteIcon,
  VoteGlyph,
} from "@rallly/ui/vote-icon";
import { useTranslation } from "@/i18n/client";

const VoteIcon = ({
  type,
  size = "md",
  className,
  animated = false,
  glyph = false,
}: {
  type?: VoteType;
  size?: "sm" | "md";
  className?: string;
  /** Morph between shapes when `type` changes, for controls that cycle the vote. */
  animated?: boolean;
  /** The bare mark without its badge, for cells already tinted by the vote. */
  glyph?: boolean;
}) => {
  const { t } = useTranslation();

  const title = type
    ? {
        yes: t("yes", { defaultValue: "Yes" }),
        ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
        no: t("no", { defaultValue: "No" }),
      }[type]
    : t("pending", { defaultValue: "Pending" });

  const Icon = glyph ? VoteGlyph : animated ? AnimatedVoteIcon : BaseVoteIcon;

  return (
    <Icon
      type={type ?? "pending"}
      size={size}
      title={title}
      className={className}
    />
  );
};

export default VoteIcon;
