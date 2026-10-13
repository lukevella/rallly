"use client";

import { cn } from "@rallly/ui";
import { Progress } from "@rallly/ui/progress";
import { Trans, useTranslation } from "@/i18n/client";

export function OpenPollUsageBar({
  openCount,
  limit,
  label = <Trans i18nKey="openPolls" defaults="Open polls" />,
}: {
  openCount: number;
  limit: number;
  /** Replaces the default label, e.g. with a popover title */
  label?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const isAtLimit = openCount >= limit;
  const usageText = t("openPollLimitUsage", {
    defaultValue: "{openCount} of {limit}",
    openCount,
    limit,
  });
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span
          className={cn(
            "text-muted-foreground tabular-nums",
            isAtLimit && "text-destructive",
          )}
        >
          {usageText}
        </span>
      </div>
      <Progress
        value={Math.min((openCount / limit) * 100, 100)}
        aria-label={t("openPolls", { defaultValue: "Open polls" })}
        getAriaValueText={() => usageText}
        className="h-2 bg-gray-100 dark:bg-gray-800"
        indicatorClassName={cn(
          "bg-none",
          isAtLimit ? "bg-destructive" : "bg-green-500",
        )}
      />
    </div>
  );
}
