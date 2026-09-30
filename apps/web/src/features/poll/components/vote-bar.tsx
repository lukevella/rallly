"use client";

import { cn } from "@rallly/ui";
import { useTranslation } from "@/i18n/client";

export function VoteBar({
  yes,
  ifNeedBe,
  total,
  className,
}: {
  yes: number;
  ifNeedBe: number;
  total: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const width = (count: number) =>
    total > 0 ? `${(count / total) * 100}%` : "0%";
  return (
    <div
      role="img"
      aria-label={t("voteBarLabel", {
        defaultValue:
          "{yes} yes, {ifNeedBe} if need be, out of {total, plural, one {1 response} other {# responses}}",
        yes,
        ifNeedBe,
        total,
      })}
      className={cn(
        "flex h-1.5 overflow-hidden rounded-sm bg-muted",
        className,
      )}
    >
      <div className="h-full bg-green-500" style={{ width: width(yes) }} />
      <div className="h-full bg-amber-400" style={{ width: width(ifNeedBe) }} />
    </div>
  );
}
